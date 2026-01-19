// Direct Supabase API - no Express backend needed
import { supabase } from './supabase';
import type { Habit, Todo, Note, WorkNote, Edit, Lift, LiftEntry, Reward, Redemption, HabitCompletion, DashboardModule } from '../types';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
};

// Helper to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj === null || typeof obj !== 'object') return obj;
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any);
};

// Helper to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj === null || typeof obj !== 'object') return obj;
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {} as any);
};

export const api = {
  async getState() {
    const userId = await getUserId();
    
    // Fetch all data in parallel
    const [habitsRes, completionsRes, todosRes, notesRes, workNotesRes, editsRes, liftsRes, liftEntriesRes, rewardsRes, redemptionsRes, modulesRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('habit_completions').select('*').eq('user_id', userId),
      supabase.from('todos').select('*').eq('user_id', userId).order('todo_order'),
      supabase.from('notes').select('*').eq('user_id', userId),
      supabase.from('work_notes').select('*').eq('user_id', userId),
      supabase.from('edits').select('*').eq('user_id', userId),
      supabase.from('lifts').select('*').eq('user_id', userId),
      supabase.from('lift_entries').select('*').eq('user_id', userId),
      supabase.from('rewards').select('*').eq('user_id', userId),
      supabase.from('redemptions').select('*').eq('user_id', userId).order('redeemed_at', { ascending: false }),
      supabase.from('dashboard_modules').select('*').eq('user_id', userId).order('position'),
    ]);

    if (habitsRes.error) throw habitsRes.error;
    if (completionsRes.error) throw completionsRes.error;
    if (todosRes.error) throw todosRes.error;
    if (notesRes.error) throw notesRes.error;
    if (workNotesRes.error) throw workNotesRes.error;
    if (editsRes.error) throw editsRes.error;
    if (liftsRes.error) throw liftsRes.error;
    if (liftEntriesRes.error) throw liftEntriesRes.error;
    if (rewardsRes.error) throw rewardsRes.error;
    if (redemptionsRes.error) throw redemptionsRes.error;
    if (modulesRes.error) throw modulesRes.error;

    // Convert to camelCase and map special fields
    const habits = (habitsRes.data || []).map((h: any) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      tokenReward: h.token_reward,
      category: h.category,
      schedule: h.schedule,
      createdAt: h.created_at,
      archived: h.archived,
      emoji: h.emoji,
    })) as Habit[];
    
    const habitCompletions = (completionsRes.data || []).map((hc: any) => ({
      id: hc.id,
      habitId: hc.habit_id,
      date: hc.date,
      completedAt: hc.completed_at,
    })) as HabitCompletion[];
    
    const todos = (todosRes.data || []).map((t: any) => ({
      id: t.id,
      text: t.text,
      completed: t.completed,
      tokenReward: t.token_reward,
      createdAt: t.created_at,
      completedAt: t.completed_at,
      order: t.todo_order,
      isWork: t.is_work,
      workDate: t.work_date,
    })) as Todo[];
    const notes = (notesRes.data || []).map((n: any) => ({
      id: n.id,
      content: n.content,
      date: n.date,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    })) as Note[];
    
    const workNotes = (workNotesRes.data || []).map((wn: any) => ({
      id: wn.id,
      content: wn.content,
      category: wn.category,
      createdAt: wn.created_at,
      updatedAt: wn.updated_at,
    })) as WorkNote[];
    
    const edits = (editsRes.data || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      completed: e.completed,
      createdAt: e.created_at,
      completedAt: e.completed_at,
    })) as Edit[];
    
    const lifts = (liftsRes.data || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      currentWeight: l.current_weight,
      oneRepMax: l.one_rep_max,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    })) as Lift[];
    
    const liftEntries = (liftEntriesRes.data || []).map((le: any) => ({
      id: le.id,
      liftId: le.lift_id,
      weight: le.weight,
      reps: le.reps,
      date: le.date,
      notes: le.notes,
      createdAt: le.created_at,
    })) as LiftEntry[];
    
    const rewards = (rewardsRes.data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: r.price,
      createdAt: r.created_at,
    })) as Reward[];
    
    const redemptions = (redemptionsRes.data || []).map((rd: any) => ({
      id: rd.id,
      rewardId: rd.reward_id,
      rewardName: rd.reward_name,
      price: rd.price,
      redeemedAt: rd.redeemed_at,
    })) as Redemption[];
    
    const dashboardModules = (modulesRes.data || []).map((m: any) => ({
      id: m.id,
      type: m.type,
      position: m.position,
      config: m.config ? JSON.parse(m.config) : null,
    })) as DashboardModule[];

    // Calculate token balance
    let tokenBalance = 0;
    habitCompletions.forEach(hc => {
      const habit = habits.find(h => h.id === hc.habitId);
      if (habit) tokenBalance += habit.tokenReward;
    });
    todos.forEach(t => {
      if (t.completed && t.tokenReward) tokenBalance += t.tokenReward;
    });
    redemptions.forEach(r => {
      tokenBalance -= r.price;
    });

    // Get journal prompts setting
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'journalPromptsEnabled')
      .eq('user_id', userId)
      .single();
    
    const journalPromptsEnabled = settingsData?.value === 'true';

    return {
      habits,
      habitCompletions,
      todos,
      notes,
      workNotes,
      edits,
      lifts,
      liftEntries,
      rewards,
      redemptions,
      dashboardModules,
      tokenBalance,
      journalPromptsEnabled,
      loading: false,
    };
  },

  async createHabit(habit: Partial<Habit>) {
    const userId = await getUserId();
    const { data: result, error } = await supabase.from('habits').insert({
      id: habit.id,
      name: habit.name,
      description: habit.description || null,
      token_reward: habit.tokenReward,
      category: habit.category || null,
      schedule: habit.schedule,
      created_at: habit.createdAt,
      archived: habit.archived || false,
      emoji: habit.emoji || null,
      user_id: userId,
    }).select().single();
    if (error) throw error;
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      tokenReward: result.token_reward,
      category: result.category,
      schedule: result.schedule,
      createdAt: result.created_at,
      archived: result.archived,
      emoji: result.emoji,
    } as Habit;
  },

  async updateHabit(id: string, habit: Partial<Habit>) {
    const userId = await getUserId();
    const data = toSnakeCase(habit);
    const { data: result, error } = await supabase.from('habits').update(data).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return toCamelCase(result) as Habit;
  },

  async deleteHabit(id: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  },

  async createHabitCompletion(completion: Partial<HabitCompletion>) {
    const userId = await getUserId();
    const data = toSnakeCase({ ...completion, userId });
    const { data: result, error } = await supabase.from('habit_completions').insert(data).select().single();
    if (error) throw error;
    return toCamelCase(result) as HabitCompletion;
  },

  async deleteHabitCompletion(habitId: string, date: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('habit_completions').delete().eq('habit_id', habitId).eq('date', date).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  },

  async createTodo(todo: Partial<Todo>) {
    const userId = await getUserId();
    const { data: result, error } = await supabase.from('todos').insert({
      id: todo.id,
      text: todo.text,
      completed: todo.completed || false,
      token_reward: todo.tokenReward || null,
      created_at: todo.createdAt,
      completed_at: todo.completedAt || null,
      todo_order: todo.order || 0,
      is_work: todo.isWork || false,
      work_date: todo.workDate || null,
      user_id: userId,
    }).select().single();
    if (error) throw error;
    return {
      id: result.id,
      text: result.text,
      completed: result.completed,
      tokenReward: result.token_reward,
      createdAt: result.created_at,
      completedAt: result.completed_at,
      order: result.todo_order,
      isWork: result.is_work,
      workDate: result.work_date,
    } as Todo;
  },

  async updateTodo(id: string, todo: Partial<Todo>) {
    const userId = await getUserId();
    const data = toSnakeCase(todo);
    const { data: result, error } = await supabase.from('todos').update(data).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return toCamelCase(result) as Todo;
  },

  async reorderTodos(todos: Todo[]) {
    const userId = await getUserId();
    const updates = todos.map((todo, index) => ({
      id: todo.id,
      todo_order: index,
    }));
    
    for (const update of updates) {
      const { error } = await supabase.from('todos').update({ todo_order: update.todo_order }).eq('id', update.id).eq('user_id', userId);
      if (error) throw error;
    }
    return { success: true };
  },

  async deleteTodo(id: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  },

  async createNote(note: Partial<Note>) {
    const userId = await getUserId();
    const data = toSnakeCase({ ...note, userId });
    const { data: result, error } = await supabase.from('notes').insert(data).select().single();
    if (error) throw error;
    return toCamelCase(result) as Note;
  },

  async updateNote(id: string, note: Partial<Note>) {
    const userId = await getUserId();
    const data = toSnakeCase(note);
    const { data: result, error } = await supabase.from('notes').update(data).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return toCamelCase(result) as Note;
  },

  async deleteNote(id: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  },

  async createWorkNote(note: Partial<WorkNote>) {
    const userId = await getUserId();
    const data = toSnakeCase({ ...note, userId });
    const { data: result, error } = await supabase.from('work_notes').insert(data).select().single();
    if (error) throw error;
    return toCamelCase(result) as WorkNote;
  },

  async updateWorkNote(id: string, note: Partial<WorkNote>) {
    const userId = await getUserId();
    const data = toSnakeCase(note);
    const { data: result, error } = await supabase.from('work_notes').update(data).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return toCamelCase(result) as WorkNote;
  },

  async deleteWorkNote(id: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('work_notes').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  },

  async createEdit(edit: Partial<Edit>) {
    const userId = await getUserId();
    const data = toSnakeCase({ ...edit, userId });
    const { data: result, error } = await supabase.from('edits').insert(data).select().single();
    if (error) throw error;
    return toCamelCase(result) as Edit;
  },

  async updateEdit(id: string, edit: Partial<Edit>) {
    const userId = await getUserId();
    const data = toSnakeCase(edit);
    const { data: result, error } = await supabase.from('edits').update(data).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return toCamelCase(result) as Edit;
  },

  async deleteEdit(id: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('edits').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  },

  async createLift(lift: Partial<Lift>) {
    const userId = await getUserId();
    const data = toSnakeCase({ ...lift, userId });
    const { data: result, error } = await supabase.from('lifts').insert(data).select().single();
    if (error) throw error;
    return toCamelCase(result) as Lift;
  },

  async updateLift(id: string, lift: Partial<Lift>) {
    const userId = await getUserId();
    const data = toSnakeCase(lift);
    const { data: result, error } = await supabase.from('lifts').update(data).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return toCamelCase(result) as Lift;
  },

  async deleteLift(id: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('lifts').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  },

  async createLiftEntry(entry: Partial<LiftEntry>) {
    const userId = await getUserId();
    const data = toSnakeCase({ ...entry, userId });
    const { data: result, error } = await supabase.from('lift_entries').insert(data).select().single();
    if (error) throw error;
    return toCamelCase(result) as LiftEntry;
  },

  async updateLiftEntry(id: string, entry: Partial<LiftEntry>) {
    const userId = await getUserId();
    const data = toSnakeCase(entry);
    const { data: result, error } = await supabase.from('lift_entries').update(data).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return toCamelCase(result) as LiftEntry;
  },

  async deleteLiftEntry(id: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('lift_entries').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  },

  async createReward(reward: Partial<Reward>) {
    const userId = await getUserId();
    const data = toSnakeCase({ ...reward, userId });
    const { data: result, error } = await supabase.from('rewards').insert(data).select().single();
    if (error) throw error;
    return toCamelCase(result) as Reward;
  },

  async updateReward(id: string, reward: Partial<Reward>) {
    const userId = await getUserId();
    const data = toSnakeCase(reward);
    const { data: result, error } = await supabase.from('rewards').update(data).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return toCamelCase(result) as Reward;
  },

  async deleteReward(id: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('rewards').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  },

  async createRedemption(redemption: Partial<Redemption>) {
    const userId = await getUserId();
    const data = toSnakeCase({ ...redemption, userId });
    const { data: result, error } = await supabase.from('redemptions').insert(data).select().single();
    if (error) throw error;
    return toCamelCase(result) as Redemption;
  },

  async updateDashboardModules(modules: DashboardModule[]) {
    const userId = await getUserId();
    
    // Delete existing modules
    await supabase.from('dashboard_modules').delete().eq('user_id', userId);
    
    // Insert new modules
    const data = modules.map(m => toSnakeCase({ ...m, userId }));
    const { data: result, error } = await supabase.from('dashboard_modules').insert(data).select();
    if (error) throw error;
    return toCamelCase(result) as DashboardModule[];
  },

  async updateJournalPrompts(enabled: boolean) {
    const userId = await getUserId();
    const { error } = await supabase.from('settings').upsert({ key: 'journalPromptsEnabled', value: String(enabled), user_id: userId });
    if (error) throw error;
    return { success: true };
  },
};
