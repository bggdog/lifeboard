export type HabitSchedule = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  tokenReward: number;
  category?: string;
  schedule: HabitSchedule;
  createdAt: string;
  archived: boolean;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;
  completedAt: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  tokenReward?: number;
  createdAt: string;
  completedAt?: string;
  order: number;
  isWork?: boolean;
  workDate?: string;
}

export interface Note {
  id: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkNote {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export type EditType = 'short-form' | 'long-form' | 'therapy-company-episode';

export interface Edit {
  id: string;
  title: string;
  type: EditType;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  price: number;
  createdAt: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  rewardName: string;
  price: number;
  redeemedAt: string;
}

export type DashboardModuleType = 
  | 'habits'
  | 'todos'
  | 'journal'
  | 'token-balance'
  | 'rewards-shortcut'
  | 'habit-categories'
  | 'focus-card'
  | 'notes-feed';

export interface DashboardModule {
  id: string;
  type: DashboardModuleType;
  position: number;
  config?: Record<string, any>;
}

export interface AppState {
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  todos: Todo[];
  notes: Note[];
  workNotes: WorkNote[];
  edits: Edit[];
  lifts: Lift[];
  liftEntries: LiftEntry[];
  rewards: Reward[];
  redemptions: Redemption[];
  tokenBalance: number;
  dashboardModules: DashboardModule[];
  journalPromptsEnabled: boolean;
  loading: boolean;
}

export const WORK_NOTE_CATEGORIES = [
  'Random',
  'The Therapy Company',
  'Short Form Video Ideas',
  'Overall Strategy Notes',
  'Best Practices Notes',
  'Analytics Review Notes',
  'Meeting Notes',
] as const;

export type WorkNoteCategory = typeof WORK_NOTE_CATEGORIES[number];

export const EDIT_TYPES = {
  'short-form': { label: 'Short Form', tokens: 100 },
  'long-form': { label: 'Long Form', tokens: 250 },
  'therapy-company-episode': { label: 'The Therapy Company Episode', tokens: 750 },
} as const;

export interface Lift {
  id: string;
  name: string;
  currentWeight: number;
  oneRepMax: number;
  createdAt: string;
  updatedAt: string;
}

export interface LiftEntry {
  id: string;
  liftId: string;
  weight: number;
  reps: number;
  date: string;
  notes?: string;
  createdAt: string;
}
