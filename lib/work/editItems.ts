// Edit items data layer
import { supabase } from '../supabase/client';
import { applyTokenDelta } from '../tokens';

export type EditItemType = 'short_form' | 'long_form' | 'full_episode';
export type EditItemStatus = 'queued' | 'in_progress' | 'done';

export interface EditItem {
  id: string;
  profile_id: string;
  title: string;
  type: EditItemType;
  status: EditItemStatus;
  tokens: number;
  created_at: string;
  completed_at: string | null;
}

/**
 * Fetch all edit items for a profile
 */
export async function fetchEditItems(profileId: string): Promise<EditItem[]> {
  const { data, error } = await supabase
    .from('edit_items')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching edit items:', error);
    throw error;
  }

  return (data || []) as EditItem[];
}

/**
 * Create a new edit item
 */
export async function createEditItem(
  profileId: string,
  params: {
    title: string;
    type: EditItemType;
    tokens?: number;
  }
): Promise<EditItem> {
  const { data, error } = await supabase
    .from('edit_items')
    .insert({
      profile_id: profileId,
      title: params.title.trim(),
      type: params.type,
      status: 'queued',
      tokens: params.tokens || 2,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating edit item:', error);
    throw error;
  }

  return data as EditItem;
}

/**
 * Set edit item status with token integration
 */
export async function setEditItemStatus(params: {
  profileId: string;
  id: string;
  status: EditItemStatus;
  title: string;
  tokens: number;
  previousStatus?: EditItemStatus;
}): Promise<{ item: EditItem; newBalance?: number }> {
  const { profileId, id, status, title, tokens, previousStatus } = params;

  // Get current item to check previous status
  const { data: currentItem, error: fetchError } = await supabase
    .from('edit_items')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching edit item:', fetchError);
    throw fetchError;
  }

  const wasDone = (previousStatus || currentItem?.status) === 'done';
  const willBeDone = status === 'done';

  // Update item
  const updateData: { status: EditItemStatus; completed_at: string | null } = {
    status,
    completed_at: willBeDone ? new Date().toISOString() : null,
  };

  const { data: updatedItem, error: updateError } = await supabase
    .from('edit_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating edit item status:', updateError);
    throw updateError;
  }

  // Apply token delta if status changed to/from done
  let newBalance: number | undefined;
  if (tokens > 0) {
    if (willBeDone && !wasDone) {
      // Moving to done - award tokens
      try {
        const result = await applyTokenDelta({
          profileId,
          delta: tokens,
          type: 'edit_done',
          sourceTable: 'edit_items',
          sourceId: id,
          meta: {
            title,
            tokens,
            type: updatedItem.type,
          },
        });
        newBalance = result.newBalance;
        const { tokenStore } = await import('../tokenStore');
        tokenStore.setBalance(result.newBalance);
      } catch (tokenError) {
        console.error('Error applying token delta:', tokenError);
      }
    } else if (!willBeDone && wasDone) {
      // Moving away from done - reverse tokens
      try {
        const result = await applyTokenDelta({
          profileId,
          delta: -tokens,
          type: 'edit_undone',
          sourceTable: 'edit_items',
          sourceId: id,
          meta: {
            title,
            tokens,
            type: updatedItem.type,
          },
        });
        newBalance = result.newBalance;
        const { tokenStore } = await import('../tokenStore');
        tokenStore.setBalance(result.newBalance);
      } catch (tokenError) {
        console.error('Error applying token delta:', tokenError);
      }
    }
  }

  return { item: updatedItem as EditItem, newBalance };
}

/**
 * Delete an edit item
 */
export async function deleteEditItem(id: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('edit_items')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error deleting edit item:', error);
    throw error;
  }
}
