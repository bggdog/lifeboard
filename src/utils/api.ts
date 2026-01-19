// Determine API base URL
// In production (Vercel), use relative /api which routes to serverless functions
// In development, use localhost if VITE_API_URL is not set
const getApiBase = () => {
  // If VITE_API_URL is explicitly set, use it
  if ((import.meta as any).env?.VITE_API_URL) {
    const base = (import.meta as any).env.VITE_API_URL;
    console.log('[API] Using VITE_API_URL:', base);
    return base;
  }
  
  // In development mode, use localhost
  if ((import.meta as any).env?.DEV) {
    const base = 'http://localhost:3001/api';
    console.log('[API] Using DEV localhost:', base);
    return base;
  }
  
  // In production, use relative URL (works with Vercel serverless functions)
  const base = '/api';
  console.log('[API] Using production relative URL:', base);
  return base;
};

const API_BASE = getApiBase();
console.log('[API] API_BASE determined:', API_BASE, {
  isDev: !!(import.meta as any).env?.DEV,
  hasViteApiUrl: !!(import.meta as any).env?.VITE_API_URL,
  timestamp: Date.now(),
  sessionId: 'debug-session',
  runId: 'run2',
  hypothesisId: 'C'
});

export const api = {
  async getState() {
    try {
      const response = await fetch(`${API_BASE}/state`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache control to ensure fresh data
        cache: 'no-cache',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch state: ${response.status} ${errorText || response.statusText}`);
      }
      return response.json();
    } catch (error: any) {
      console.error('API Error in getState:', error);
      throw error;
    }
  },

  async createHabit(habit: any) {
    const response = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create habit';
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

  async updateHabit(id: string, habit: any) {
    const response = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update habit';
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

  async deleteHabit(id: string) {
    const response = await fetch(`${API_BASE}/habits/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to delete habit';
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

  async createHabitCompletion(completion: any) {
    const response = await fetch(`${API_BASE}/habit-completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completion),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create completion';
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

  async deleteHabitCompletion(habitId: string, date: string) {
    const response = await fetch(`${API_BASE}/habit-completions/${habitId}/${date}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to delete completion';
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

  async createTodo(todo: any) {
    const response = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create todo';
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

  async updateTodo(id: string, todo: any) {
    const response = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update todo';
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

  async reorderTodos(todos: any[]) {
    const response = await fetch(`${API_BASE}/todos/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todos }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to reorder todos';
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

  async deleteTodo(id: string) {
    const response = await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to delete todo';
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

  async createNote(note: any) {
    const response = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create note';
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

  async updateNote(id: string, note: any) {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update note';
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

  async deleteNote(id: string) {
    const response = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to delete note';
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
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to delete work note';
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

  async createEdit(edit: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/080f6d9e-85d9-485e-81c2-7a9cfae0db22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:createEdit:ENTRY',message:'Creating edit',data:{apiBase:API_BASE,editId:edit?.id,editTitle:edit?.title,editType:edit?.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const requestBody = JSON.stringify(edit);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/080f6d9e-85d9-485e-81c2-7a9cfae0db22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:createEdit:BEFORE_FETCH',message:'Request details',data:{url:`${API_BASE}/edits`,method:'POST',bodyLength:requestBody.length,bodyPreview:requestBody.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    let response;
    try {
      response = await fetch(`${API_BASE}/edits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/080f6d9e-85d9-485e-81c2-7a9cfae0db22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:createEdit:AFTER_FETCH',message:'Response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } catch (networkError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/080f6d9e-85d9-485e-81c2-7a9cfae0db22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:createEdit:NETWORK_ERROR',message:'Network error caught',data:{error:networkError?.message,errorType:networkError?.name,stack:networkError?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      throw networkError;
    }
    if (!response.ok) {
      const errorText = await response.text();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/080f6d9e-85d9-485e-81c2-7a9cfae0db22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:createEdit:ERROR_RESPONSE',message:'Non-OK response',data:{status:response.status,statusText:response.statusText,errorText:errorText.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      let errorMessage = 'Failed to create edit';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.details || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    const result = await response.json();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/080f6d9e-85d9-485e-81c2-7a9cfae0db22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:createEdit:SUCCESS',message:'Edit created successfully',data:{result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return result;
  },

  async updateEdit(id: string, edit: any) {
    const response = await fetch(`${API_BASE}/edits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edit),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update edit';
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

  async deleteEdit(id: string) {
    const response = await fetch(`${API_BASE}/edits/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to delete edit';
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
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update lift';
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

  async deleteLift(id: string) {
    const response = await fetch(`${API_BASE}/lifts/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to delete lift';
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

  async createLiftEntry(entry: any) {
    const response = await fetch(`${API_BASE}/lift-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create lift entry';
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

  async updateLiftEntry(id: string, entry: any) {
    const response = await fetch(`${API_BASE}/lift-entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update lift entry';
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

  async deleteLiftEntry(id: string) {
    const response = await fetch(`${API_BASE}/lift-entries/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to delete lift entry';
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

  async createReward(reward: any) {
    const response = await fetch(`${API_BASE}/rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reward),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create reward';
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

  async updateReward(id: string, reward: any) {
    const response = await fetch(`${API_BASE}/rewards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reward),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update reward';
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

  async deleteReward(id: string) {
    const response = await fetch(`${API_BASE}/rewards/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to delete reward';
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

  async createRedemption(redemption: any) {
    const response = await fetch(`${API_BASE}/redemptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(redemption),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create redemption';
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
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update setting';
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
};
