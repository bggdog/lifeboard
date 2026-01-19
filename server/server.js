import express from 'express';
import cors from 'cors';
import { db } from './db.js';

console.log('[server.js] Module loading - db imported:', {
  hasDb: !!db,
  dbType: typeof db,
  timestamp: Date.now()
});

// Load environment variables (only for local development, Vercel provides them automatically)
// Note: dotenv is handled in db.js for local development

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Add request logging for debugging
app.use((req, res, next) => {
  // #region agent log
  console.log('[EXPRESS MIDDLEWARE] Request', {
    method: req.method,
    path: req.path,
    url: req.url,
    bodyKeys: req.body ? Object.keys(req.body) : 'no body',
    query: req.query,
    env: {
      vercel: process.env.VERCEL,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run2',
    hypothesisId: 'A'
  });
  // #endregion
  next();
});

// Initialize default dashboard modules if none exist
const initializeDefaults = async () => {
  try {
    const modules = await db.getDashboardModules();
    if (modules.length === 0) {
      const defaultModules = [
        { id: '1', type: 'token-balance', position: 0, config: null },
        { id: '2', type: 'habits', position: 1, config: null },
        { id: '3', type: 'todos', position: 2, config: null },
        { id: '4', type: 'journal', position: 3, config: null },
      ];
      await db.setDashboardModules(defaultModules);
      if (process.env.VERCEL !== '1') {
        console.log('Initialized default dashboard modules');
      }
    }
  } catch (error) {
    console.error('Error initializing defaults:', error);
  }
};

// Initialize defaults on import (works for both serverless and regular server)
// Don't await in module scope for serverless - it will be called on first request
// For Vercel, we'll initialize on first request instead
let initialized = false;
if (process.env.VERCEL !== '1') {
  initializeDefaults();
}

// Health check endpoint - simplest possible, no DB access
app.get('/api/health', (req, res) => {
  console.log('[HEALTH] Health check called');
  try {
    res.json({ 
      status: 'ok', 
      message: 'Backend server is running', 
      database: 'Supabase',
      hasDb: !!db,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[HEALTH] Error in health check:', error);
    res.status(500).json({ 
      error: 'Health check failed',
      details: error?.message 
    });
  }
});

// Get all state
app.get('/api/state', async (req, res) => {
  try {
    const [habits, habitCompletions, todos, notes, workNotes, edits, lifts, liftEntries, rewards, redemptions, dashboardModules] = await Promise.all([
      db.getHabits(),
      db.getHabitCompletions(),
      db.getTodos(),
      db.getNotes(),
      db.getWorkNotes(),
      db.getEdits(),
      db.getLifts(),
      db.getLiftEntries(),
      db.getRewards(),
      db.getRedemptions(),
      db.getDashboardModules(),
    ]);
    
    // Calculate token balance
    let tokenBalance = 0;
    habitCompletions.forEach(hc => {
      const habit = habits.find(h => h.id === hc.habitId);
      if (habit) tokenBalance += habit.tokenReward;
    });
    
    todos.filter(t => t.completed && t.tokenReward).forEach(t => {
      tokenBalance += t.tokenReward;
    });
    
    edits.filter(e => e.completed).forEach(e => {
      const editType = e.type;
      if (editType === 'short-form') tokenBalance += 100;
      else if (editType === 'long-form') tokenBalance += 250;
      else if (editType === 'therapy-company-episode') tokenBalance += 750;
    });
    
    redemptions.forEach(r => {
      tokenBalance -= r.price;
    });
    
    const journalPromptsEnabled = await db.getSetting('journalPromptsEnabled');
    
    res.json({
      habits: habits.map(h => ({ ...h, archived: h.archived || false })),
      habitCompletions,
      todos: todos.map(t => ({ ...t, completed: t.completed || false })),
      notes,
      workNotes,
      edits,
      lifts,
      liftEntries,
      rewards,
      redemptions,
      tokenBalance: Math.max(0, tokenBalance),
      dashboardModules: dashboardModules.map(m => ({ ...m, config: m.config ? JSON.parse(m.config) : undefined })),
      journalPromptsEnabled: journalPromptsEnabled === 'true',
    });
  } catch (error: any) {
    console.error('Error fetching state:', error);
    res.status(500).json({ error: 'Failed to fetch state', details: error?.message || error?.details || String(error) });
  }
});

// Habits
app.post('/api/habits', async (req, res) => {
  try {
    await db.addHabit(req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit', details: error?.message || error?.details || String(error) });
  }
});

app.put('/api/habits/:id', async (req, res) => {
  try {
    await db.updateHabit(req.params.id, req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Failed to update habit', details: error?.message || error?.details || String(error) });
  }
});

app.delete('/api/habits/:id', async (req, res) => {
  try {
    await db.deleteHabit(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit', details: error?.message || error?.details || String(error) });
  }
});

// Habit completions
app.post('/api/habit-completions', async (req, res) => {
  try {
    await db.addHabitCompletion(req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error creating completion:', error);
    res.status(500).json({ error: 'Failed to create completion', details: error?.message || error?.details || String(error) });
  }
});

app.delete('/api/habit-completions/:habitId/:date', async (req, res) => {
  try {
    await db.deleteHabitCompletion(req.params.habitId, req.params.date);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting completion:', error);
    res.status(500).json({ error: 'Failed to delete completion', details: error?.message || error?.details || String(error) });
  }
});

// Todos
app.post('/api/todos', async (req, res) => {
  try {
    const result = await db.addTodo(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo', details: error?.message || error?.details || String(error) });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    await db.updateTodo(req.params.id, req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo', details: error?.message || error?.details || String(error) });
  }
});

app.put('/api/todos/reorder', async (req, res) => {
  try {
    await db.reorderTodos(req.body.todos);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering todos:', error);
    res.status(500).json({ error: 'Failed to reorder todos', details: error?.message || error?.details || String(error) });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    await db.deleteTodo(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo', details: error?.message || error?.details || String(error) });
  }
});

// Notes
app.post('/api/notes', async (req, res) => {
  try {
    await db.addNote(req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note', details: error?.message || error?.details || String(error) });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    await db.updateNote(req.params.id, req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note', details: error?.message || error?.details || String(error) });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await db.deleteNote(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note', details: error?.message || error?.details || String(error) });
  }
});

// Work Notes
app.post('/api/work-notes', async (req, res) => {
  try {
    await db.addWorkNote(req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error creating work note:', error);
    res.status(500).json({ error: 'Failed to create work note', details: error?.message || error?.details || String(error) });
  }
});

app.put('/api/work-notes/:id', async (req, res) => {
  try {
    await db.updateWorkNote(req.params.id, req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating work note:', error);
    res.status(500).json({ error: 'Failed to update work note', details: error?.message || error?.details || String(error) });
  }
});

app.delete('/api/work-notes/:id', async (req, res) => {
  try {
    await db.deleteWorkNote(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting work note:', error);
    res.status(500).json({ error: 'Failed to delete work note', details: error?.message || error?.details || String(error) });
  }
});

// Edits
app.post('/api/edits', async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/080f6d9e-85d9-485e-81c2-7a9cfae0db22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:POST/api/edits:ENTRY',message:'Edit endpoint hit',data:{bodyKeys:Object.keys(req.body||{}),bodyPreview:JSON.stringify(req.body).substring(0,200),hasSupabaseUrl:!!process.env.SUPABASE_URL,hasSupabaseKey:!!process.env.SUPABASE_ANON_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/080f6d9e-85d9-485e-81c2-7a9cfae0db22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:POST/api/edits:BEFORE_DB',message:'Before db.addEdit',data:{editId:req.body?.id,editTitle:req.body?.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const result = await db.addEdit(req.body);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/080f6d9e-85d9-485e-81c2-7a9cfae0db22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:POST/api/edits:AFTER_DB',message:'db.addEdit succeeded',data:{resultId:result?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    res.json({ success: true });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/080f6d9e-85d9-485e-81c2-7a9cfae0db22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:POST/api/edits:ERROR',message:'Error in edit endpoint',data:{errorMessage:error?.message,errorCode:error?.code,errorDetails:error?.details,errorHint:error?.hint,errorStack:error?.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('Error creating edit:', error);
    res.status(500).json({ 
      error: 'Failed to create edit', 
      details: error?.message || error?.details || error?.hint || String(error),
      code: error?.code
    });
  }
});

app.put('/api/edits/:id', async (req, res) => {
  try {
    await db.updateEdit(req.params.id, req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating edit:', error);
    res.status(500).json({ error: 'Failed to update edit', details: error?.message || error?.details || String(error) });
  }
});

app.delete('/api/edits/:id', async (req, res) => {
  try {
    await db.deleteEdit(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting edit:', error);
    res.status(500).json({ error: 'Failed to delete edit', details: error?.message || error?.details || String(error) });
  }
});

// Lifts
app.post('/api/lifts', async (req, res) => {
  try {
    await db.addLift(req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error creating lift:', error);
    res.status(500).json({ error: 'Failed to create lift', details: error?.message || error?.details || String(error) });
  }
});

app.put('/api/lifts/:id', async (req, res) => {
  try {
    await db.updateLift(req.params.id, req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating lift:', error);
    res.status(500).json({ error: 'Failed to update lift', details: error?.message || error?.details || String(error) });
  }
});

app.delete('/api/lifts/:id', async (req, res) => {
  try {
    await db.deleteLift(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting lift:', error);
    res.status(500).json({ error: 'Failed to delete lift', details: error?.message || error?.details || String(error) });
  }
});

// Lift Entries
app.post('/api/lift-entries', async (req, res) => {
  try {
    await db.addLiftEntry(req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error creating lift entry:', error);
    res.status(500).json({ error: 'Failed to create lift entry', details: error?.message || error?.details || String(error) });
  }
});

app.put('/api/lift-entries/:id', async (req, res) => {
  try {
    await db.updateLiftEntry(req.params.id, req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating lift entry:', error);
    res.status(500).json({ error: 'Failed to update lift entry', details: error?.message || error?.details || String(error) });
  }
});

app.delete('/api/lift-entries/:id', async (req, res) => {
  try {
    await db.deleteLiftEntry(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting lift entry:', error);
    res.status(500).json({ error: 'Failed to delete lift entry', details: error?.message || error?.details || String(error) });
  }
});

// Rewards
app.post('/api/rewards', async (req, res) => {
  try {
    await db.addReward(req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error creating reward:', error);
    res.status(500).json({ error: 'Failed to create reward', details: error?.message || error?.details || String(error) });
  }
});

app.put('/api/rewards/:id', async (req, res) => {
  try {
    await db.updateReward(req.params.id, req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating reward:', error);
    res.status(500).json({ error: 'Failed to update reward', details: error?.message || error?.details || String(error) });
  }
});

app.delete('/api/rewards/:id', async (req, res) => {
  try {
    await db.deleteReward(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting reward:', error);
    res.status(500).json({ error: 'Failed to delete reward', details: error?.message || error?.details || String(error) });
  }
});

// Redemptions
app.post('/api/redemptions', async (req, res) => {
  try {
    await db.addRedemption(req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error creating redemption:', error);
    res.status(500).json({ error: 'Failed to create redemption', details: error?.message || error?.details || String(error) });
  }
});

// Dashboard modules
app.put('/api/dashboard-modules', async (req, res) => {
  try {
    const { modules } = req.body;
    // Ensure config is stringified
    const modulesWithStringConfig = modules.map(m => ({
      ...m,
      config: m.config ? JSON.stringify(m.config) : null,
    }));
    await db.setDashboardModules(modulesWithStringConfig);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating dashboard modules:', error);
    res.status(500).json({ error: 'Failed to update dashboard modules', details: error?.message || error?.details || String(error) });
  }
});

// Settings
app.put('/api/settings/journal-prompts', async (req, res) => {
  try {
    const { enabled } = req.body;
    await db.setSetting('journalPromptsEnabled', enabled);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting', details: error?.message || error?.details || String(error) });
  }
});

// Export app for Vercel serverless functions
export default app;

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Using Supabase database`);
    await initializeDefaults();
  });
}
