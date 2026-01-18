import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Habit, Todo, Note, WorkNote, Edit, Lift, LiftEntry, Reward, Redemption, HabitCompletion, DashboardModule } from '../types';
import { api } from '../utils/api';
import { format } from 'date-fns';

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'ARCHIVE_HABIT'; payload: Habit }
  | { type: 'COMPLETE_HABIT'; payload: { habitId: string; date: string; completion?: HabitCompletion } }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'UPDATE_TODO'; payload: Todo }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'REORDER_TODOS'; payload: Todo[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'ADD_WORK_NOTE'; payload: WorkNote }
  | { type: 'UPDATE_WORK_NOTE'; payload: WorkNote }
  | { type: 'DELETE_WORK_NOTE'; payload: string }
  | { type: 'ADD_EDIT'; payload: Edit }
  | { type: 'UPDATE_EDIT'; payload: Edit }
  | { type: 'DELETE_EDIT'; payload: string }
  | { type: 'ADD_LIFT'; payload: Lift }
  | { type: 'UPDATE_LIFT'; payload: Lift }
  | { type: 'DELETE_LIFT'; payload: string }
  | { type: 'ADD_LIFT_ENTRY'; payload: LiftEntry }
  | { type: 'UPDATE_LIFT_ENTRY'; payload: LiftEntry }
  | { type: 'DELETE_LIFT_ENTRY'; payload: string }
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'UPDATE_REWARD'; payload: Reward }
  | { type: 'DELETE_REWARD'; payload: string }
  | { type: 'REDEEM_REWARD'; payload: { reward: Reward; redemption: Redemption } }
  | { type: 'UPDATE_DASHBOARD_MODULES'; payload: DashboardModule[] }
  | { type: 'TOGGLE_JOURNAL_PROMPTS'; payload: boolean };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_STATE':
      return { ...action.payload, loading: false };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return { ...state, habits: state.habits.map(h => h.id === action.payload.id ? action.payload : h) };
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.payload), habitCompletions: state.habitCompletions.filter(hc => hc.habitId !== action.payload) };
    case 'ARCHIVE_HABIT':
      return { ...state, habits: state.habits.map(h => h.id === action.payload.id ? action.payload : h) };
    case 'COMPLETE_HABIT': {
      const { habitId, date, completion } = action.payload;
      const existingCompletion = state.habitCompletions.find(hc => hc.habitId === habitId && hc.date === date);
      let newCompletions = [...state.habitCompletions];
      if (existingCompletion) {
        newCompletions = newCompletions.filter(hc => hc.id !== existingCompletion.id);
      } else if (completion) {
        newCompletions.push(completion);
      }
      return { ...state, habitCompletions: newCompletions };
    }
    case 'ADD_TODO':
      return { ...state, todos: [...state.todos, action.payload] };
    case 'UPDATE_TODO':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TODO':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) };
    case 'REORDER_TODOS':
      return { ...state, todos: action.payload };
    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, action.payload] };
    case 'UPDATE_NOTE':
      return { ...state, notes: state.notes.map(n => n.id === action.payload.id ? action.payload : n) };
    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter(n => n.id !== action.payload) };
    case 'ADD_WORK_NOTE':
      return { ...state, workNotes: [...state.workNotes, action.payload] };
    case 'UPDATE_WORK_NOTE':
      return { ...state, workNotes: state.workNotes.map(n => n.id === action.payload.id ? action.payload : n) };
    case 'DELETE_WORK_NOTE':
      return { ...state, workNotes: state.workNotes.filter(n => n.id !== action.payload) };
    case 'ADD_EDIT':
      return { ...state, edits: [...state.edits, action.payload] };
    case 'UPDATE_EDIT':
      return { ...state, edits: state.edits.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EDIT':
      return { ...state, edits: state.edits.filter(e => e.id !== action.payload) };
    case 'ADD_LIFT':
      return { ...state, lifts: [...state.lifts, action.payload] };
    case 'UPDATE_LIFT':
      return { ...state, lifts: state.lifts.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_LIFT':
      return { ...state, lifts: state.lifts.filter(l => l.id !== action.payload), liftEntries: state.liftEntries.filter(le => le.liftId !== action.payload) };
    case 'ADD_LIFT_ENTRY':
      return { ...state, liftEntries: [...state.liftEntries, action.payload] };
    case 'UPDATE_LIFT_ENTRY':
      return { ...state, liftEntries: state.liftEntries.map(le => le.id === action.payload.id ? action.payload : le) };
    case 'DELETE_LIFT_ENTRY':
      return { ...state, liftEntries: state.liftEntries.filter(le => le.id !== action.payload) };
    case 'ADD_REWARD':
      return { ...state, rewards: [...state.rewards, action.payload] };
    case 'UPDATE_REWARD':
      return { ...state, rewards: state.rewards.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_REWARD':
      return { ...state, rewards: state.rewards.filter(r => r.id !== action.payload), redemptions: state.redemptions.filter(red => red.rewardId !== action.payload) };
    case 'REDEEM_REWARD':
      return { ...state, redemptions: [...state.redemptions, action.payload.redemption] };
    case 'UPDATE_DASHBOARD_MODULES':
      return { ...state, dashboardModules: action.payload };
    case 'TOGGLE_JOURNAL_PROMPTS':
      return { ...state, journalPromptsEnabled: action.payload };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  isHabitCompleted: (habitId: string, date?: string) => boolean;
  getTodayNote: () => Note | undefined;
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  completeHabit: (habitId: string, date: string) => Promise<void>;
  addTodo: (todo: Todo) => Promise<void>;
  updateTodo: (todo: Todo) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  reorderTodos: (todos: Todo[]) => Promise<void>;
  addNote: (note: Note) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addWorkNote: (note: WorkNote) => Promise<void>;
  updateWorkNote: (note: WorkNote) => Promise<void>;
  deleteWorkNote: (id: string) => Promise<void>;
  addEdit: (edit: Edit) => Promise<void>;
  updateEdit: (edit: Edit) => Promise<void>;
  deleteEdit: (id: string) => Promise<void>;
  addLift: (lift: Lift) => Promise<void>;
  updateLift: (lift: Lift) => Promise<void>;
  deleteLift: (id: string) => Promise<void>;
  addLiftEntry: (entry: LiftEntry) => Promise<void>;
  updateLiftEntry: (entry: LiftEntry) => Promise<void>;
  deleteLiftEntry: (id: string) => Promise<void>;
  addReward: (reward: Reward) => Promise<void>;
  updateReward: (reward: Reward) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  redeemReward: (reward: Reward) => Promise<void>;
  updateDashboardModules: (modules: DashboardModule[]) => Promise<void>;
  toggleJournalPrompts: (enabled: boolean) => Promise<void>;
  refreshState: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, {
    habits: [],
    habitCompletions: [],
    todos: [],
    notes: [],
    workNotes: [],
    edits: [],
    lifts: [],
    liftEntries: [],
    rewards: [],
    redemptions: [],
    tokenBalance: 0,
    dashboardModules: [],
    journalPromptsEnabled: false,
    loading: true,
  });

  const refreshState = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await api.getState();
      dispatch({ type: 'LOAD_STATE', payload: data });
    } catch (error) {
      console.error('Error loading state:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({
        type: 'LOAD_STATE',
        payload: {
          habits: [],
          habitCompletions: [],
          todos: [],
          notes: [],
          workNotes: [],
          edits: [],
          lifts: [],
          liftEntries: [],
          rewards: [],
          redemptions: [],
          tokenBalance: 0,
          dashboardModules: [
            { id: '1', type: 'token-balance', position: 0 },
            { id: '2', type: 'habits', position: 1 },
            { id: '3', type: 'todos', position: 2 },
            { id: '4', type: 'journal', position: 3 },
          ],
          journalPromptsEnabled: false,
          loading: false,
        },
      });
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  const addHabit = async (habit: Habit) => {
    await api.createHabit(habit);
    dispatch({ type: 'ADD_HABIT', payload: habit });
    await refreshState();
  };

  const updateHabit = async (habit: Habit) => {
    await api.updateHabit(habit.id, habit);
    dispatch({ type: 'UPDATE_HABIT', payload: habit });
    await refreshState();
  };

  const deleteHabit = async (id: string) => {
    await api.deleteHabit(id);
    dispatch({ type: 'DELETE_HABIT', payload: id });
    await refreshState();
  };

  const archiveHabit = async (id: string) => {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;
    const updated = { ...habit, archived: !habit.archived };
    await api.updateHabit(id, updated);
    dispatch({ type: 'ARCHIVE_HABIT', payload: updated });
    await refreshState();
  };

  const completeHabit = async (habitId: string, date: string) => {
    const existingCompletion = state.habitCompletions.find(hc => hc.habitId === habitId && hc.date === date);
    if (existingCompletion) {
      await api.deleteHabitCompletion(habitId, date);
      dispatch({ type: 'COMPLETE_HABIT', payload: { habitId, date } });
    } else {
      const completion: HabitCompletion = {
        id: `hc-${Date.now()}`,
        habitId,
        date,
        completedAt: new Date().toISOString(),
      };
      await api.createHabitCompletion(completion);
      dispatch({ type: 'COMPLETE_HABIT', payload: { habitId, date, completion } });
    }
    await refreshState();
  };

  const addTodo = async (todo: Todo) => {
    try {
      await api.createTodo(todo);
      dispatch({ type: 'ADD_TODO', payload: todo });
      await refreshState();
    } catch (error) {
      console.error('Error in addTodo:', error);
      throw error;
    }
  };

  const updateTodo = async (todo: Todo) => {
    await api.updateTodo(todo.id, todo);
    dispatch({ type: 'UPDATE_TODO', payload: todo });
    await refreshState();
  };

  const deleteTodo = async (id: string) => {
    await api.deleteTodo(id);
    dispatch({ type: 'DELETE_TODO', payload: id });
    await refreshState();
  };

  const reorderTodos = async (todos: Todo[]) => {
    await api.reorderTodos(todos);
    dispatch({ type: 'REORDER_TODOS', payload: todos });
    await refreshState();
  };

  const addNote = async (note: Note) => {
    await api.createNote(note);
    dispatch({ type: 'ADD_NOTE', payload: note });
    await refreshState();
  };

  const updateNote = async (note: Note) => {
    await api.updateNote(note.id, note);
    dispatch({ type: 'UPDATE_NOTE', payload: note });
    await refreshState();
  };

  const deleteNote = async (id: string) => {
    await api.deleteNote(id);
    dispatch({ type: 'DELETE_NOTE', payload: id });
    await refreshState();
  };

  const addWorkNote = async (note: WorkNote) => {
    await api.createWorkNote(note);
    dispatch({ type: 'ADD_WORK_NOTE', payload: note });
    await refreshState();
  };

  const updateWorkNote = async (note: WorkNote) => {
    await api.updateWorkNote(note.id, note);
    dispatch({ type: 'UPDATE_WORK_NOTE', payload: note });
    await refreshState();
  };

  const deleteWorkNote = async (id: string) => {
    await api.deleteWorkNote(id);
    dispatch({ type: 'DELETE_WORK_NOTE', payload: id });
    await refreshState();
  };

  const addEdit = async (edit: Edit) => {
    await api.createEdit(edit);
    dispatch({ type: 'ADD_EDIT', payload: edit });
    await refreshState();
  };

  const updateEdit = async (edit: Edit) => {
    await api.updateEdit(edit.id, edit);
    dispatch({ type: 'UPDATE_EDIT', payload: edit });
    await refreshState();
  };

  const deleteEdit = async (id: string) => {
    await api.deleteEdit(id);
    dispatch({ type: 'DELETE_EDIT', payload: id });
    await refreshState();
  };

  const addLift = async (lift: Lift) => {
    await api.createLift(lift);
    dispatch({ type: 'ADD_LIFT', payload: lift });
    await refreshState();
  };

  const updateLift = async (lift: Lift) => {
    await api.updateLift(lift.id, lift);
    dispatch({ type: 'UPDATE_LIFT', payload: lift });
    await refreshState();
  };

  const deleteLift = async (id: string) => {
    await api.deleteLift(id);
    dispatch({ type: 'DELETE_LIFT', payload: id });
    await refreshState();
  };

  const addLiftEntry = async (entry: LiftEntry) => {
    await api.createLiftEntry(entry);
    dispatch({ type: 'ADD_LIFT_ENTRY', payload: entry });
    await refreshState();
  };

  const updateLiftEntry = async (entry: LiftEntry) => {
    await api.updateLiftEntry(entry.id, entry);
    dispatch({ type: 'UPDATE_LIFT_ENTRY', payload: entry });
    await refreshState();
  };

  const deleteLiftEntry = async (id: string) => {
    await api.deleteLiftEntry(id);
    dispatch({ type: 'DELETE_LIFT_ENTRY', payload: id });
    await refreshState();
  };

  const addReward = async (reward: Reward) => {
    await api.createReward(reward);
    dispatch({ type: 'ADD_REWARD', payload: reward });
    await refreshState();
  };

  const updateReward = async (reward: Reward) => {
    await api.updateReward(reward.id, reward);
    dispatch({ type: 'UPDATE_REWARD', payload: reward });
    await refreshState();
  };

  const deleteReward = async (id: string) => {
    await api.deleteReward(id);
    dispatch({ type: 'DELETE_REWARD', payload: id });
    await refreshState();
  };

  const redeemReward = async (reward: Reward) => {
    const redemption: Redemption = {
      id: `redemption-${Date.now()}`,
      rewardId: reward.id,
      rewardName: reward.name,
      price: reward.price,
      redeemedAt: new Date().toISOString(),
    };
    await api.createRedemption(redemption);
    dispatch({ type: 'REDEEM_REWARD', payload: { reward, redemption } });
    await refreshState();
  };

  const updateDashboardModules = async (modules: DashboardModule[]) => {
    await api.updateDashboardModules(modules);
    dispatch({ type: 'UPDATE_DASHBOARD_MODULES', payload: modules });
    await refreshState();
  };

  const toggleJournalPrompts = async (enabled: boolean) => {
    await api.updateJournalPrompts(enabled);
    dispatch({ type: 'TOGGLE_JOURNAL_PROMPTS', payload: enabled });
    await refreshState();
  };

  const isHabitCompleted = (habitId: string, date?: string): boolean => {
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');
    return state.habitCompletions.some(hc => hc.habitId === habitId && hc.date === targetDate);
  };

  const getTodayNote = (): Note | undefined => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return state.notes.find(n => n.date === today);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        isHabitCompleted,
        getTodayNote,
        addHabit,
        updateHabit,
        deleteHabit,
        archiveHabit,
        completeHabit,
        addTodo,
        updateTodo,
        deleteTodo,
        reorderTodos,
        addNote,
        updateNote,
        deleteNote,
        addWorkNote,
        updateWorkNote,
        deleteWorkNote,
        addEdit,
        updateEdit,
        deleteEdit,
        addLift,
        updateLift,
        deleteLift,
        addLiftEntry,
        updateLiftEntry,
        deleteLiftEntry,
        addReward,
        updateReward,
        deleteReward,
        redeemReward,
        updateDashboardModules,
        toggleJournalPrompts,
        refreshState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
