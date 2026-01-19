import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file (only for local development)
// Vercel provides environment variables automatically, so we skip in production
if (process.env.VERCEL !== '1') {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
export const db = {
  // Habits
  async getHabits() {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(h => ({
      id: h.id,
      name: h.name,
      description: h.description,
      tokenReward: h.token_reward,
      category: h.category,
      schedule: h.schedule,
      createdAt: h.created_at,
      archived: h.archived || false,
      emoji: h.emoji || null,
    }));
  },

  async addHabit(habit) {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        id: habit.id,
        name: habit.name,
        description: habit.description || null,
        token_reward: habit.tokenReward,
        category: habit.category || null,
        schedule: habit.schedule,
        created_at: habit.createdAt,
        archived: habit.archived || false,
        emoji: habit.emoji || null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      tokenReward: data.token_reward,
      category: data.category,
      schedule: data.schedule,
      createdAt: data.created_at,
      archived: data.archived,
      emoji: data.emoji || null,
    };
  },

  async updateHabit(id, updates) {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.tokenReward !== undefined) updateData.token_reward = updates.tokenReward;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.schedule !== undefined) updateData.schedule = updates.schedule;
    if (updates.archived !== undefined) updateData.archived = updates.archived;
    if (updates.emoji !== undefined) updateData.emoji = updates.emoji || null;
    
    const { data, error } = await supabase
      .from('habits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      tokenReward: data.token_reward,
      category: data.category,
      schedule: data.schedule,
      createdAt: data.created_at,
      archived: data.archived,
      emoji: data.emoji || null,
    };
  },

  async deleteHabit(id) {
    await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', id);
    
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Habit Completions
  async getHabitCompletions() {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*');
    if (error) throw error;
    return (data || []).map(hc => ({
      id: hc.id,
      habitId: hc.habit_id,
      date: hc.date,
      completedAt: hc.completed_at,
    }));
  },

  async addHabitCompletion(completion) {
    const { data, error } = await supabase
      .from('habit_completions')
      .insert({
        id: completion.id,
        habit_id: completion.habitId,
        date: completion.date,
        completed_at: completion.completedAt,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      habitId: data.habit_id,
      date: data.date,
      completedAt: data.completed_at,
    };
  },

  async deleteHabitCompletion(habitId, date) {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', date);
    if (error) throw error;
  },

  // Todos
  async getTodos() {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('todo_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(todo => ({
      id: todo.id,
      text: todo.text,
      completed: todo.completed || false,
      tokenReward: todo.token_reward,
      createdAt: todo.created_at,
      completedAt: todo.completed_at,
      order: todo.todo_order,
      isWork: todo.is_work || false,
      workDate: todo.work_date || undefined,
    }));
  },

  async addTodo(todo) {
    const { data, error } = await supabase
      .from('todos')
      .insert({
        id: todo.id,
        text: todo.text,
        completed: todo.completed || false,
        token_reward: todo.tokenReward || null,
        created_at: todo.createdAt,
        completed_at: todo.completedAt || null,
        todo_order: todo.order,
        is_work: todo.isWork || false,
        work_date: todo.workDate || null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      text: data.text,
      completed: data.completed,
      tokenReward: data.token_reward,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      order: data.todo_order,
      isWork: data.is_work || false,
      workDate: data.work_date || undefined,
    };
  },

  async updateTodo(id, updates) {
    const updateData = {};
    if (updates.text !== undefined) updateData.text = updates.text;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.tokenReward !== undefined) updateData.token_reward = updates.tokenReward;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
    if (updates.order !== undefined) updateData.todo_order = updates.order;
    if (updates.isWork !== undefined) updateData.is_work = updates.isWork;
    if (updates.workDate !== undefined) updateData.work_date = updates.workDate || null;
    
    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      text: data.text,
      completed: data.completed,
      tokenReward: data.token_reward,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      order: data.todo_order,
      isWork: data.is_work || false,
      workDate: data.work_date || undefined,
    };
  },

  async deleteTodo(id) {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async reorderTodos(todos) {
    const updates = todos.map(todo => 
      supabase
        .from('todos')
        .update({ todo_order: todo.order })
        .eq('id', todo.id)
    );
    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0].error;
  },

  // Notes
  async getNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(note => ({
      id: note.id,
      content: note.content,
      date: note.date,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }));
  },

  async addNote(note) {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        id: note.id,
        content: note.content,
        date: note.date,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      content: data.content,
      date: data.date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateNote(id, updates) {
    const updateData = {};
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.updatedAt !== undefined) updateData.updated_at = updates.updatedAt;
    
    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      content: data.content,
      date: data.date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async deleteNote(id) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Rewards
  async getRewards() {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(reward => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      price: reward.price,
      createdAt: reward.created_at,
    }));
  },

  async addReward(reward) {
    const { data, error } = await supabase
      .from('rewards')
      .insert({
        id: reward.id,
        name: reward.name,
        description: reward.description || null,
        price: reward.price,
        created_at: reward.createdAt,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      createdAt: data.created_at,
    };
  },

  async updateReward(id, updates) {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    
    const { data, error } = await supabase
      .from('rewards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      createdAt: data.created_at,
    };
  },

  async deleteReward(id) {
    await supabase
      .from('redemptions')
      .delete()
      .eq('reward_id', id);
    
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Redemptions
  async getRedemptions() {
    const { data, error } = await supabase
      .from('redemptions')
      .select('*')
      .order('redeemed_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(red => ({
      id: red.id,
      rewardId: red.reward_id,
      rewardName: red.reward_name,
      price: red.price,
      redeemedAt: red.redeemed_at,
    }));
  },

  async addRedemption(redemption) {
    const { data, error } = await supabase
      .from('redemptions')
      .insert({
        id: redemption.id,
        reward_id: redemption.rewardId,
        reward_name: redemption.rewardName,
        price: redemption.price,
        redeemed_at: redemption.redeemedAt,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      rewardId: data.reward_id,
      rewardName: data.reward_name,
      price: data.price,
      redeemedAt: data.redeemed_at,
    };
  },

  // Dashboard Modules
  async getDashboardModules() {
    const { data, error } = await supabase
      .from('dashboard_modules')
      .select('*')
      .order('position', { ascending: true });
    if (error) throw error;
    return (data || []).map(m => ({
      id: m.id,
      type: m.type,
      position: m.position,
      config: m.config ? JSON.parse(m.config) : undefined,
    }));
  },

  async setDashboardModules(modules) {
    await supabase.from('dashboard_modules').delete().neq('id', '0');
    
    if (modules.length > 0) {
      const modulesData = modules.map(m => ({
        id: m.id,
        type: m.type,
        position: m.position,
        config: m.config ? JSON.stringify(m.config) : null,
      }));
      
      const { error } = await supabase
        .from('dashboard_modules')
        .insert(modulesData);
      if (error) throw error;
    }
  },

  // Settings
  async getSetting(key) {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data?.value || null;
  },

  async setSetting(key, value) {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value: String(value) }, { onConflict: 'key' });
    if (error) throw error;
  },

  // Work Notes
  async getWorkNotes() {
    const { data, error } = await supabase
      .from('work_notes')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(note => ({
      id: note.id,
      content: note.content,
      category: note.category,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }));
  },

  async addWorkNote(note) {
    const { data, error } = await supabase
      .from('work_notes')
      .insert({
        id: note.id,
        content: note.content,
        category: note.category,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      content: data.content,
      category: data.category,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateWorkNote(id, updates) {
    const updateData = {};
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.updatedAt !== undefined) updateData.updated_at = updates.updatedAt;
    
    const { data, error } = await supabase
      .from('work_notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      content: data.content,
      category: data.category,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async deleteWorkNote(id) {
    const { error } = await supabase
      .from('work_notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Edits
  async getEdits() {
    const { data, error } = await supabase
      .from('edits')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(edit => ({
      id: edit.id,
      title: edit.title,
      type: edit.type,
      completed: edit.completed || false,
      createdAt: edit.created_at,
      completedAt: edit.completed_at || undefined,
    }));
  },

  async addEdit(edit) {
    const { data, error } = await supabase
      .from('edits')
      .insert({
        id: edit.id,
        title: edit.title,
        type: edit.type,
        completed: edit.completed || false,
        created_at: edit.createdAt,
        completed_at: edit.completedAt || null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      type: data.type,
      completed: data.completed,
      createdAt: data.created_at,
      completedAt: data.completed_at || undefined,
    };
  },

  async updateEdit(id, updates) {
    const updateData = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt || null;
    
    const { data, error } = await supabase
      .from('edits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      type: data.type,
      completed: data.completed,
      createdAt: data.created_at,
      completedAt: data.completed_at || undefined,
    };
  },

  async deleteEdit(id) {
    const { error } = await supabase
      .from('edits')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Lifts
  async getLifts() {
    const { data, error } = await supabase
      .from('lifts')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(lift => ({
      id: lift.id,
      name: lift.name,
      currentWeight: lift.current_weight || 0,
      oneRepMax: lift.one_rep_max || 0,
      createdAt: lift.created_at,
      updatedAt: lift.updated_at,
    }));
  },

  async addLift(lift) {
    const { data, error } = await supabase
      .from('lifts')
      .insert({
        id: lift.id,
        name: lift.name,
        current_weight: lift.currentWeight || 0,
        one_rep_max: lift.oneRepMax || 0,
        created_at: lift.createdAt,
        updated_at: lift.updatedAt,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      currentWeight: data.current_weight || 0,
      oneRepMax: data.one_rep_max || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateLift(id, updates) {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.currentWeight !== undefined) updateData.current_weight = updates.currentWeight;
    if (updates.oneRepMax !== undefined) updateData.one_rep_max = updates.oneRepMax;
    if (updates.updatedAt !== undefined) updateData.updated_at = updates.updatedAt;
    
    const { data, error } = await supabase
      .from('lifts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      currentWeight: data.current_weight || 0,
      oneRepMax: data.one_rep_max || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async deleteLift(id) {
    await supabase
      .from('lift_entries')
      .delete()
      .eq('lift_id', id);
    
    const { error } = await supabase
      .from('lifts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Lift Entries
  async getLiftEntries() {
    const { data, error } = await supabase
      .from('lift_entries')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(entry => ({
      id: entry.id,
      liftId: entry.lift_id,
      weight: entry.weight,
      reps: entry.reps,
      date: entry.date,
      notes: entry.notes || undefined,
      createdAt: entry.created_at,
    }));
  },

  async addLiftEntry(entry) {
    const { data, error } = await supabase
      .from('lift_entries')
      .insert({
        id: entry.id,
        lift_id: entry.liftId,
        weight: entry.weight,
        reps: entry.reps,
        date: entry.date,
        notes: entry.notes || null,
        created_at: entry.createdAt,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      liftId: data.lift_id,
      weight: data.weight,
      reps: data.reps,
      date: data.date,
      notes: data.notes || undefined,
      createdAt: data.created_at,
    };
  },

  async updateLiftEntry(id, updates) {
    const updateData = {};
    if (updates.weight !== undefined) updateData.weight = updates.weight;
    if (updates.reps !== undefined) updateData.reps = updates.reps;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;
    
    const { data, error } = await supabase
      .from('lift_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      liftId: data.lift_id,
      weight: data.weight,
      reps: data.reps,
      date: data.date,
      notes: data.notes || undefined,
      createdAt: data.created_at,
    };
  },

  async deleteLiftEntry(id) {
    const { error } = await supabase
      .from('lift_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
