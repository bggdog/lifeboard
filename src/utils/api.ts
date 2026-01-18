const API_BASE = (import.meta as any).env?.VITE_API_URL || ((import.meta as any).env?.DEV ? '/api' : 'http://localhost:3001/api');

export const api = {
  async getState() {
    const response = await fetch(`${API_BASE}/state`);
    if (!response.ok) throw new Error('Failed to fetch state');
    return response.json();
  },

  async createHabit(habit: any) {
    const response = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    });
    if (!response.ok) throw new Error('Failed to create habit');
    return response.json();
  },

  async updateHabit(id: string, habit: any) {
    const response = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    });
    if (!response.ok) throw new Error('Failed to update habit');
    return response.json();
  },

  async deleteHabit(id: string) {
    const response = await fetch(`${API_BASE}/habits/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete habit');
    return response.json();
  },

  async createHabitCompletion(completion: any) {
    const response = await fetch(`${API_BASE}/habit-completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completion),
    });
    if (!response.ok) throw new Error('Failed to create completion');
    return response.json();
  },

  async deleteHabitCompletion(habitId: string, date: string) {
    const response = await fetch(`${API_BASE}/habit-completions/${habitId}/${date}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete completion');
    return response.json();
  },

  async createTodo(todo: any) {
    const response = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) throw new Error('Failed to create todo');
    return response.json();
  },

  async updateTodo(id: string, todo: any) {
    const response = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) throw new Error('Failed to update todo');
    return response.json();
  },

  async reorderTodos(todos: any[]) {
    const response = await fetch(`${API_BASE}/todos/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todos }),
    });
    if (!response.ok) throw new Error('Failed to reorder todos');
    return response.json();
  },

  async deleteTodo(id: string) {
    const response = await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete todo');
    return response.json();
  },

  async createNote(note: any) {
    const response = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!response.ok) throw new Error('Failed to create note');
    return response.json();
  },

  async updateNote(id: string, note: any) {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!response.ok) throw new Error('Failed to update note');
    return response.json();
  },

  async deleteNote(id: string) {
    const response = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete note');
    return response.json();
  },

  async createWorkNote(note: any) {
    const response = await fetch(`${API_BASE}/work-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create work note: ${errorText || response.statusText}`);
    }
    return response.json();
  },

  async updateWorkNote(id: string, note: any) {
    const response = await fetch(`${API_BASE}/work-notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update work note: ${errorText || response.statusText}`);
    }
    return response.json();
  },

  async deleteWorkNote(id: string) {
    const response = await fetch(`${API_BASE}/work-notes/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete work note');
    return response.json();
  },

  async createEdit(edit: any) {
    const response = await fetch(`${API_BASE}/edits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edit),
    });
    if (!response.ok) throw new Error('Failed to create edit');
    return response.json();
  },

  async updateEdit(id: string, edit: any) {
    const response = await fetch(`${API_BASE}/edits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edit),
    });
    if (!response.ok) throw new Error('Failed to update edit');
    return response.json();
  },

  async deleteEdit(id: string) {
    const response = await fetch(`${API_BASE}/edits/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete edit');
    return response.json();
  },

  async createLift(lift: any) {
    const response = await fetch(`${API_BASE}/lifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lift),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create lift';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.details || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  async updateLift(id: string, lift: any) {
    const response = await fetch(`${API_BASE}/lifts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lift),
    });
    if (!response.ok) throw new Error('Failed to update lift');
    return response.json();
  },

  async deleteLift(id: string) {
    const response = await fetch(`${API_BASE}/lifts/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete lift');
    return response.json();
  },

  async createLiftEntry(entry: any) {
    const response = await fetch(`${API_BASE}/lift-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error('Failed to create lift entry');
    return response.json();
  },

  async updateLiftEntry(id: string, entry: any) {
    const response = await fetch(`${API_BASE}/lift-entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error('Failed to update lift entry');
    return response.json();
  },

  async deleteLiftEntry(id: string) {
    const response = await fetch(`${API_BASE}/lift-entries/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete lift entry');
    return response.json();
  },

  async createReward(reward: any) {
    const response = await fetch(`${API_BASE}/rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reward),
    });
    if (!response.ok) throw new Error('Failed to create reward');
    return response.json();
  },

  async updateReward(id: string, reward: any) {
    const response = await fetch(`${API_BASE}/rewards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reward),
    });
    if (!response.ok) throw new Error('Failed to update reward');
    return response.json();
  },

  async deleteReward(id: string) {
    const response = await fetch(`${API_BASE}/rewards/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete reward');
    return response.json();
  },

  async createRedemption(redemption: any) {
    const response = await fetch(`${API_BASE}/redemptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(redemption),
    });
    if (!response.ok) throw new Error('Failed to create redemption');
    return response.json();
  },

  async updateDashboardModules(modules: any[]) {
    try {
      const response = await fetch(`${API_BASE}/dashboard-modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to update dashboard modules'}`);
      }
      return response.json();
    } catch (error: any) {
      if (error.message) throw error;
      throw new Error(`Network error: ${error.message || 'Cannot connect to backend server'}`);
    }
  },

  async updateJournalPrompts(enabled: boolean) {
    const response = await fetch(`${API_BASE}/settings/journal-prompts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) throw new Error('Failed to update setting');
    return response.json();
  },
};
