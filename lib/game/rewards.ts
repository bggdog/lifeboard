// Rewards shop data layer
import { supabase } from '../supabase/client';
import { applyTokenDelta } from '../tokens';

export interface Reward {
  id: string;
  profile_id: string;
  name: string;
  cost_tokens: number;
  icon: string | null;
  created_at: string;
}

export interface RewardRedemption {
  id: string;
  profile_id: string;
  reward_id: string;
  redeemed_at: string;
  cost_tokens: number;
  created_at: string;
}

/**
 * Fetch all rewards for a profile
 */
export async function fetchRewards(profileId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rewards:', error);
    throw error;
  }

  return (data || []) as Reward[];
}

/**
 * Create a new reward
 */
export async function createReward(
  profileId: string,
  params: {
    name: string;
    costTokens: number;
    icon?: string | null;
  }
): Promise<Reward> {
  const { data, error } = await supabase
    .from('rewards')
    .insert({
      profile_id: profileId,
      name: params.name.trim(),
      cost_tokens: params.costTokens,
      icon: params.icon?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating reward:', error);
    throw error;
  }

  return data as Reward;
}

/**
 * Redeem a reward (spend tokens)
 */
export async function redeemReward(
  profileId: string,
  reward: Reward
): Promise<{ redemption: RewardRedemption; newBalance: number }> {
  // Check token balance first
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('token_balance')
    .eq('id', profileId)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    throw profileError;
  }

  const currentBalance = profile?.token_balance ?? 0;
  if (currentBalance < reward.cost_tokens) {
    throw new Error(`Insufficient tokens. Need ${reward.cost_tokens}, have ${currentBalance}`);
  }

  // Insert redemption record
  const { data: redemption, error: redemptionError } = await supabase
    .from('reward_redemptions')
    .insert({
      profile_id: profileId,
      reward_id: reward.id,
      cost_tokens: reward.cost_tokens,
    })
    .select()
    .single();

  if (redemptionError) {
    console.error('Error creating redemption:', redemptionError);
    throw redemptionError;
  }

  // Apply token delta (spend tokens)
  const result = await applyTokenDelta({
    profileId,
    delta: -reward.cost_tokens,
    type: 'reward_redeem',
    sourceTable: 'rewards',
    sourceId: reward.id,
    meta: {
      name: reward.name,
      costTokens: reward.cost_tokens,
    },
  });

  return {
    redemption: redemption as RewardRedemption,
    newBalance: result.newBalance,
  };
}

/**
 * Fetch recent redemptions for a profile
 */
export async function fetchRecentRedemptions(
  profileId: string,
  limit: number = 10
): Promise<RewardRedemption[]> {
  const { data, error } = await supabase
    .from('reward_redemptions')
    .select('*')
    .eq('profile_id', profileId)
    .order('redeemed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching redemptions:', error);
    throw error;
  }

  return (data || []) as RewardRedemption[];
}
