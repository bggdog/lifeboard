'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus, Flame, Sparkles, ArrowRight, Home, Coins } from 'lucide-react';
import AppShell from '@/components/AppShell';
import AnimateStagger from '@/components/ui/AnimateStagger';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import Pill from '@/components/ui/Pill';
import ProgressBar from '@/components/ui/ProgressBar';
import { getOrCreateProfile } from '@/lib/profile';
import { getTokenBalance } from '@/lib/tokens';
import { tokenStore } from '@/lib/tokenStore';
import { fetchHabits, createHabit, toggleHabitForToday, type Habit } from '@/lib/habits';
import { fetchLast7DaysCompletions, getToday } from '@/lib/habitCompletions';
import { fetchTodos, createTodo, toggleTodoComplete, type Todo } from '@/lib/todos';
import { fetchWorkTodos, createWorkTodo, toggleWorkTodoComplete, type WorkTodo } from '@/lib/work/workTodos';
import { fetchEditItems, setEditItemStatus, type EditItem } from '@/lib/work/editItems';
import { fetchLifts, type Lift } from '@/lib/gym/lifts';
import { createSet } from '@/lib/gym/sets';
import { fetchTodayStats } from '@/lib/game/daily';
import { fetchLifeAreas, createDefaultLifeAreas, type LifeArea } from '@/lib/lifeAreas';
import { fetchLifeAreaScores } from '@/lib/lifeAreaScores';
import { recomputeAllLifeAreas } from '@/lib/recompute';
import { supabase } from '@/lib/supabase/client';
import { subscribeToTable, subscribeToProfile } from '@/lib/realtime';
import { applyPassiveDecay } from '@/lib/lifeDecay';
import { getLastWeekIncompleteReview } from '@/lib/weeklyReview';
import { getTimeAwareHeader, getTimeAwareToneClass, getRelativeTimeText } from '@/lib/timeOfDay';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type QuickAddMode = 'todo' | 'work' | 'habit' | 'lift';

export default function TodayPage() {
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Add state
  const [quickAddMode, setQuickAddMode] = useState<QuickAddMode>('todo');
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddTokens, setQuickAddTokens] = useState(1);
  const [quickAddLifeAreaId, setQuickAddLifeAreaId] = useState<string | null>(null);
  const [quickAddLiftId, setQuickAddLiftId] = useState<string | null>(null);
  const [quickAddWeight, setQuickAddWeight] = useState('');
  const [quickAddReps, setQuickAddReps] = useState('');
  const [pendingQuickAdd, setPendingQuickAdd] = useState(false);

  // Data state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<Record<string, Set<string>>>({});
  const [todos, setTodos] = useState<Todo[]>([]);
  const [workTodos, setWorkTodos] = useState<WorkTodo[]>([]);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [lifeAreaScores, setLifeAreaScores] = useState<Record<string, { score: number; status: string }>>({});
  const [todayStats, setTodayStats] = useState<{ actions_completed: number; tokens_earned: number; streak: number } | null>(null);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [weeklyReviewPending, setWeeklyReviewPending] = useState(false);

  // Pending states
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());

  const today = getToday();

  // Load all data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const profile = await getOrCreateProfile();
        setProfileId(profile.id);
        console.log('[Today] Profile ID:', profile.id);

        // Load token balance
        const balance = await getTokenBalance(profile.id);
        tokenStore.setBalance(balance);

        // Load profile XP and level
        const { data: profileData } = await supabase
          .from('profiles')
          .select('xp, level')
          .eq('id', profile.id)
          .single();

        if (profileData) {
          setXp(profileData.xp ?? 0);
          setLevel(profileData.level ?? 1);
        }

        // Ensure default life areas exist
        await createDefaultLifeAreas(profile.id);

        // Apply passive decay (runs once per day)
        applyPassiveDecay(profile.id).catch((err) => {
          console.error('Error applying passive decay:', err);
        });

        // Check for pending weekly review
        const pendingReview = await getLastWeekIncompleteReview(profile.id);
        setWeeklyReviewPending(!!pendingReview);

        // Fetch all data in parallel
        const [
          habitsData,
          todosData,
          workTodosData,
          editItemsData,
          liftsData,
          lifeAreasData,
          statsData,
        ] = await Promise.all([
          fetchHabits(profile.id),
          fetchTodos(profile.id),
          fetchWorkTodos(profile.id),
          fetchEditItems(profile.id),
          fetchLifts(profile.id),
          fetchLifeAreas(profile.id),
          fetchTodayStats(profile.id),
        ]);

        // Recompute life area scores (non-blocking)
        recomputeAllLifeAreas(profile.id).catch((err) => {
          console.error('Error recomputing life areas:', err);
        });

        // Fetch life area scores
        const scoresData = await fetchLifeAreaScores(profile.id);
        const scoresMap: Record<string, { score: number; status: string }> = {};
        Object.keys(scoresData).forEach((areaId) => {
          scoresMap[areaId] = {
            score: scoresData[areaId].score,
            status: scoresData[areaId].status,
          };
        });
        setLifeAreaScores(scoresMap);

        const activeHabits = habitsData.filter((h) => h.active);
        setHabits(activeHabits);

        // Fetch completions for active habits
        const habitIds = activeHabits.map((h) => h.id);
        const completionsData = habitIds.length > 0 
          ? await fetchLast7DaysCompletions(profile.id, habitIds)
          : {};
        setHabitCompletions(completionsData);
        setTodos(todosData.filter((t) => !t.completed));
        setWorkTodos(workTodosData.filter((t) => !t.completed));
        setEditItems(editItemsData.filter((e) => e.status !== 'done').slice(0, 6));
        setLifts(liftsData);
        setLifeAreas(lifeAreasData);
        setTodayStats(statsData ? {
          actions_completed: statsData.actions_completed,
          tokens_earned: statsData.tokens_earned,
          streak: statsData.streak,
        } : null);
      } catch (err: any) {
        console.error('Error loading today data:', err);
        setError(err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Set up real-time subscriptions when profileId is available
  useEffect(() => {
    if (!profileId) {
      console.log('[Today] No profileId yet, skipping real-time subscriptions');
      return;
    }
    
    console.log('[Today] Setting up real-time subscriptions for profile:', profileId);

    // Subscribe to habits changes
    const unsubscribeHabits = subscribeToTable<Habit>(
      'habits',
      profileId,
      ({ eventType, new: newHabit, old: oldHabit }) => {
        if (eventType === 'INSERT' && newHabit && newHabit.active) {
          // Only add if it doesn't already exist (avoid duplicates from optimistic updates)
          setHabits((prev) => {
            const exists = prev.some((h) => h.id === newHabit.id);
            if (exists) return prev;
            return [...prev, newHabit as Habit];
          });
        } else if (eventType === 'UPDATE' && newHabit) {
          setHabits((prev) =>
            prev.map((h) => (h.id === newHabit.id ? (newHabit as Habit) : h)).filter((h) => h.active)
          );
        } else if (eventType === 'DELETE' || (oldHabit && !(newHabit as any)?.active)) {
          setHabits((prev) => prev.filter((h) => h.id !== (oldHabit?.id || newHabit?.id)));
        }
      }
    );

    // Subscribe to habit_completions changes
    const unsubscribeCompletions = subscribeToTable<{ habit_id: string; date: string; completed: boolean }>(
      'habit_completions',
      profileId,
      ({ eventType, new: newCompletion, old: oldCompletion }) => {
        if (eventType === 'INSERT' && newCompletion) {
          setHabitCompletions((prev) => {
            const next = { ...prev };
            if (!next[newCompletion.habit_id]) next[newCompletion.habit_id] = new Set();
            next[newCompletion.habit_id].add(newCompletion.date);
            return next;
          });
        } else if (eventType === 'DELETE' && oldCompletion) {
          setHabitCompletions((prev) => {
            const next = { ...prev };
            if (next[oldCompletion.habit_id]) {
              next[oldCompletion.habit_id].delete(oldCompletion.date);
            }
            return next;
          });
        }
      }
    );

    // Subscribe to todos changes
    const unsubscribeTodos = subscribeToTable<Todo>(
      'todos',
      profileId,
      ({ eventType, new: newTodo, old: oldTodo }) => {
        if (eventType === 'INSERT' && newTodo && !newTodo.completed) {
          // Only add if it doesn't already exist (avoid duplicates from optimistic updates)
          setTodos((prev) => {
            const exists = prev.some((t) => t.id === newTodo.id);
            if (exists) return prev;
            return [newTodo as Todo, ...prev];
          });
        } else if (eventType === 'UPDATE' && newTodo) {
          setTodos((prev) => {
            if (newTodo.completed) {
              return prev.filter((t) => t.id !== newTodo.id);
            } else {
              return prev.map((t) => (t.id === newTodo.id ? (newTodo as Todo) : t));
            }
          });
        } else if (eventType === 'DELETE' && oldTodo) {
          setTodos((prev) => prev.filter((t) => t.id !== oldTodo.id));
        }
      }
    );

    // Subscribe to work_todos changes
    const unsubscribeWorkTodos = subscribeToTable<any>(
      'work_todos',
      profileId,
      ({ eventType, new: newTodo, old: oldTodo }) => {
        if (eventType === 'INSERT' && newTodo && !newTodo.completed) {
          // Only add if it doesn't already exist (avoid duplicates from optimistic updates)
          setWorkTodos((prev) => {
            const exists = prev.some((t) => t.id === newTodo.id);
            if (exists) return prev;
            return [newTodo as WorkTodo, ...prev];
          });
        } else if (eventType === 'UPDATE' && newTodo) {
          setWorkTodos((prev) => {
            if (newTodo.completed) {
              return prev.filter((t) => t.id !== newTodo.id);
            } else {
              return prev.map((t) => (t.id === newTodo.id ? (newTodo as WorkTodo) : t));
            }
          });
        } else if (eventType === 'DELETE' && oldTodo) {
          setWorkTodos((prev) => prev.filter((t) => t.id !== oldTodo.id));
        }
      }
    );

    // Subscribe to edit_items changes
    const unsubscribeEditItems = subscribeToTable<any>(
      'edit_items',
      profileId,
      ({ eventType, new: newItem, old: oldItem }) => {
        if (eventType === 'INSERT' && newItem && newItem.status !== 'done') {
          // Only add if it doesn't already exist (avoid duplicates from optimistic updates)
          setEditItems((prev) => {
            const exists = prev.some((i) => i.id === newItem.id);
            if (exists) return prev;
            return [newItem as EditItem, ...prev].slice(0, 6);
          });
        } else if (eventType === 'UPDATE' && newItem) {
          setEditItems((prev) => {
            if (newItem.status === 'done') {
              return prev.filter((i) => i.id !== newItem.id);
            } else {
              return prev.map((i) => (i.id === newItem.id ? (newItem as EditItem) : i));
            }
          });
        } else if (eventType === 'DELETE' && oldItem) {
          setEditItems((prev) => prev.filter((i) => i.id !== oldItem.id));
        }
      }
    );

    // Subscribe to profile changes (token balance, XP, level)
    const unsubscribeProfile = subscribeToProfile(profileId, ({ token_balance, xp, level: newLevel }) => {
      if (token_balance !== undefined) {
        tokenStore.setBalance(token_balance);
      }
      if (xp !== undefined) {
        setXp(xp);
      }
      if (newLevel !== undefined) {
        setLevel(newLevel);
      }
    });

    // Subscribe to daily_stats changes
    const unsubscribeDailyStats = subscribeToTable<any>(
      'daily_stats',
      profileId,
      ({ eventType, new: newStats }) => {
        if ((eventType === 'INSERT' || eventType === 'UPDATE') && newStats) {
          const todayDate = getToday();
          if (newStats.date === todayDate) {
            setTodayStats({
              actions_completed: newStats.actions_completed || 0,
              tokens_earned: newStats.tokens_earned || 0,
              streak: newStats.streak || 0,
            });
          }
        }
      }
    );

    // Cleanup subscriptions on unmount or profileId change
    return () => {
      unsubscribeHabits();
      unsubscribeCompletions();
      unsubscribeTodos();
      unsubscribeWorkTodos();
      unsubscribeEditItems();
      unsubscribeProfile();
      unsubscribeDailyStats();
    };
  }, [profileId]);

  // Handle quick add
  const handleQuickAdd = async () => {
    if (!profileId || pendingQuickAdd) return;

    const title = quickAddTitle.trim();
    if (!title) return;

    setPendingQuickAdd(true);

    try {
      if (quickAddMode === 'todo') {
        const newTodo = await createTodo(profileId, title, quickAddTokens);
        setTodos((prev) => [newTodo, ...prev]);
        tokenStore.applyDelta(0); // No immediate token award
      } else if (quickAddMode === 'work') {
        const newTodo = await createWorkTodo(profileId, title, quickAddTokens);
        setWorkTodos((prev) => [newTodo, ...prev]);
        tokenStore.applyDelta(0);
      } else if (quickAddMode === 'habit') {
        const newHabit = await createHabit(profileId, title, null, quickAddTokens, quickAddLifeAreaId);
        setHabits((prev) => [...prev, newHabit]);
        tokenStore.applyDelta(0);
      } else if (quickAddMode === 'lift') {
        if (!quickAddLiftId) {
          setError('Please select a lift');
          setTimeout(() => setError(null), 3000);
          return;
        }
        const weight = parseFloat(quickAddWeight);
        const reps = parseInt(quickAddReps);
        if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
          setError('Please enter valid weight and reps');
          setTimeout(() => setError(null), 3000);
          return;
        }
        await createSet({
          profileId,
          liftId: quickAddLiftId,
          weight,
          reps,
          tokens: 1,
        });
        tokenStore.applyDelta(1);
      }

      // Reset form
      setQuickAddTitle('');
      setQuickAddTokens(1);
      setQuickAddLifeAreaId(null);
      setQuickAddLiftId(null);
      setQuickAddWeight('');
      setQuickAddReps('');

      // Refresh token balance
      const balance = await getTokenBalance(profileId);
      tokenStore.setBalance(balance);
    } catch (err: any) {
      setError(err?.message || 'Failed to add item');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingQuickAdd(false);
    }
  };

  // Handle habit toggle
  const handleToggleHabit = async (habit: Habit) => {
    if (pendingToggles.has(habit.id) || !profileId) return;

    setPendingToggles((prev) => new Set(prev).add(habit.id));

    const isCompleted = habitCompletions[habit.id]?.has(today) || false;
    const tokenDelta = isCompleted ? -habit.tokens : habit.tokens;

    // Optimistic update
    setHabitCompletions((prev) => {
      const next = { ...prev };
      if (!next[habit.id]) next[habit.id] = new Set();
      if (isCompleted) {
        next[habit.id].delete(today);
      } else {
        next[habit.id].add(today);
      }
      return next;
    });
    tokenStore.applyDelta(tokenDelta);

    try {
      await toggleHabitForToday({
        profileId,
        habitId: habit.id,
        title: habit.title,
        tokens: habit.tokens,
      });
      const balance = await getTokenBalance(profileId);
      tokenStore.setBalance(balance);
      
      // Update today stats
      const stats = await fetchTodayStats(profileId);
      if (stats) {
        setTodayStats({
          actions_completed: stats.actions_completed,
          tokens_earned: stats.tokens_earned,
          streak: stats.streak,
        });
      }
    } catch (err: any) {
      // Rollback
      setHabitCompletions((prev) => {
        const next = { ...prev };
        if (!next[habit.id]) next[habit.id] = new Set();
        if (isCompleted) {
          next[habit.id].add(today);
        } else {
          next[habit.id].delete(today);
        }
        return next;
      });
      tokenStore.applyDelta(-tokenDelta);
      setError(err?.message || 'Failed to toggle habit');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(habit.id);
        return next;
      });
    }
  };

  // Handle todo toggle
  const handleToggleTodo = async (todo: Todo) => {
    if (pendingToggles.has(todo.id) || !profileId) return;

    setPendingToggles((prev) => new Set(prev).add(todo.id));

    const newCompleted = !todo.completed;
    const tokenDelta = newCompleted ? todo.tokens : -todo.tokens;

    // Optimistic update
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: newCompleted } : t)));
    tokenStore.applyDelta(tokenDelta);

    try {
      await toggleTodoComplete(todo.id, newCompleted, {
        profileId,
        tokens: todo.tokens,
        title: todo.title,
      });
      const balance = await getTokenBalance(profileId);
      tokenStore.setBalance(balance);
      
      // Remove if completed (with slight delay for smooth transition)
      if (newCompleted) {
        setTimeout(() => {
          setTodos((prev) => prev.filter((t) => t.id !== todo.id));
        }, 200);
      }
    } catch (err: any) {
      // Rollback
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? todo : t)));
      tokenStore.applyDelta(-tokenDelta);
      setError(err?.message || 'Failed to toggle todo');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
    }
  };

  // Handle work todo toggle
  const handleToggleWorkTodo = async (todo: WorkTodo) => {
    if (pendingToggles.has(todo.id) || !profileId) return;

    setPendingToggles((prev) => new Set(prev).add(todo.id));

    const newCompleted = !todo.completed;
    const tokenDelta = newCompleted ? todo.tokens : -todo.tokens;

    // Optimistic update
    setWorkTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: newCompleted } : t)));
    tokenStore.applyDelta(tokenDelta);

    try {
      await toggleWorkTodoComplete({
        profileId,
        id: todo.id,
        completed: newCompleted,
        title: todo.title,
        tokens: todo.tokens,
      });
      const balance = await getTokenBalance(profileId);
      tokenStore.setBalance(balance);
      
      // Remove if completed (with slight delay for smooth transition)
      if (newCompleted) {
        setTimeout(() => {
          setWorkTodos((prev) => prev.filter((t) => t.id !== todo.id));
        }, 200);
      }
    } catch (err: any) {
      // Rollback
      setWorkTodos((prev) => prev.map((t) => (t.id === todo.id ? todo : t)));
      tokenStore.applyDelta(-tokenDelta);
      setError(err?.message || 'Failed to toggle work todo');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
    }
  };

  // Handle edit item status cycle
  const handleCycleEditStatus = async (item: EditItem) => {
    if (pendingToggles.has(item.id) || !profileId) return;

    const statusOrder: ('queued' | 'in_progress' | 'done')[] = ['queued', 'in_progress', 'done'];
    const currentIndex = statusOrder.indexOf(item.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    setPendingToggles((prev) => new Set(prev).add(item.id));

    // Optimistic update
    const updatedItem = { ...item, status: nextStatus };
    setEditItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));

    // If set to done, remove from list
    if (nextStatus === 'done') {
      setTimeout(() => {
        setEditItems((prev) => prev.filter((i) => i.id !== item.id));
      }, 500);
    }

    try {
      await setEditItemStatus({
        profileId,
        id: item.id,
        status: nextStatus,
        title: item.title,
        tokens: item.tokens,
        previousStatus: item.status,
      });
      const balance = await getTokenBalance(profileId);
      tokenStore.setBalance(balance);
    } catch (err: any) {
      // Rollback
      setEditItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      setError(err?.message || 'Failed to update edit item');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const getDateLabel = () => {
    const date = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const tokenOptions = [1, 2, 3, 5];
  const actionsToday = todayStats?.actions_completed ?? 0;
  const goalMet = actionsToday >= 3;
  const timeAwareTone = getTimeAwareToneClass();
  const remainingHabits = habits.filter((habit) => !(habitCompletions[habit.id]?.has(today) || false)).length;
  const remainingTasks = todos.length + workTodos.length;
  const topFocusTask = workTodos[0] ?? todos[0];
  const topFocusIsWork = Boolean(workTodos[0]);

  const getLifeAreaPillClass = (status: string) => {
    if (status === 'Excellent' || status === 'Good') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Okay') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const getLifeAreaBarClass = (status: string) => {
    if (status === 'Excellent' || status === 'Good') return 'bg-emerald-500';
    if (status === 'Okay') return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <AppShell>
      <AnimateStagger className={`p-4 sm:p-6 space-y-4 pb-24 lg:pb-6 overflow-x-hidden ${timeAwareTone}`}>
        {/* Calm Open State Header */}
        <div className={`text-sm text-neutral-400 mb-2 ${
          timeAwareTone === 'tone-night' ? 'opacity-60' : ''
        }`}>
          {getTimeAwareHeader()}
        </div>
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {isDesktop && (
          <>
            <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                Good morning, <span className="text-neutral-900 font-medium">Branson</span> — you have {remainingHabits} habits and {remainingTasks} tasks left today.
              </p>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                  {tokenStore.getBalance()} coins
                </div>
                <div className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                  Lv {level}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-accent p-5 text-white">
                <p className="text-xs text-white/80 mb-1">Actions today</p>
                <p className="text-3xl font-semibold">{actionsToday} / 3</p>
                <p className="text-xs text-white/80 mt-1">{Math.max(0, 3 - actionsToday)} more to hit your daily goal</p>
                <div className="h-1 rounded-full bg-white/30 mt-3 overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${Math.min((actionsToday / 3) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="rounded-xl bg-white border border-neutral-200 p-5">
                <p className="text-xs text-neutral-500 mb-1">Daily streak</p>
                <p className="text-3xl font-semibold text-neutral-900">{todayStats?.streak ?? 0} days</p>
                <p className="text-xs text-neutral-500 mt-1">{goalMet ? 'On track today' : 'Complete goal to build streak'}</p>
              </div>
              <div className="rounded-xl bg-white border border-neutral-200 p-5">
                <p className="text-xs text-neutral-500 mb-1">Tokens today</p>
                <p className="text-3xl font-semibold text-neutral-900">+{todayStats?.tokens_earned ?? 0}</p>
                <p className="text-xs text-amber-700 mt-1">Keep stacking rewards</p>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-accent-dark to-accent p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/80">Today's focus</p>
                <p className="text-sm font-medium text-white truncate">
                  {topFocusTask ? topFocusTask.title : 'No focus task yet - add one in Quick Add'}
                </p>
              </div>
              {topFocusTask ? (
                <button
                  onClick={() => {
                    if (topFocusIsWork) handleToggleWorkTodo(topFocusTask as WorkTodo);
                    else handleToggleTodo(topFocusTask as Todo);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-medium"
                >
                  Mark done
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <SectionHeader
                  title="Today's Habits"
                  action={
                    <button
                      onClick={() => router.push('/habits')}
                      className="text-sm text-accent font-medium"
                    >
                      View all
                    </button>
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  {habits.slice(0, 4).map((habit) => {
                    const isCompleted = habitCompletions[habit.id]?.has(today) || false;
                    return (
                      <button
                        key={habit.id}
                        onClick={() => handleToggleHabit(habit)}
                        disabled={pendingToggles.has(habit.id)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          isCompleted ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <p className={`text-sm font-medium ${isCompleted ? 'text-green-900 line-through' : 'text-neutral-900'}`}>{habit.title}</p>
                        <p className={`text-xs mt-1 ${isCompleted ? 'text-green-700' : 'text-neutral-500'}`}>+{habit.tokens} coins</p>
                      </button>
                    );
                  })}
                  {habits.length === 0 && <p className="text-sm text-neutral-400 col-span-2">No habits yet.</p>}
                </div>
              </Card>

              <Card>
                <SectionHeader
                  title="Personal To Dos"
                  action={
                    <button
                      onClick={() => router.push('/todo')}
                      className="text-sm text-accent font-medium"
                    >
                      View all
                    </button>
                  }
                />
                <div className="space-y-2">
                  {[...todos, ...workTodos].slice(0, 4).map((todo) => (
                    <button
                      key={todo.id}
                      onClick={() => ('completed_at' in todo ? handleToggleWorkTodo(todo as WorkTodo) : handleToggleTodo(todo as Todo))}
                      disabled={pendingToggles.has(todo.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 text-left"
                    >
                      <div className="w-4 h-4 rounded border border-neutral-300 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-neutral-900 truncate">{todo.title}</p>
                        <p className="text-xs text-neutral-500">{getRelativeTimeText(todo.created_at)}</p>
                      </div>
                      <span className="text-xs text-amber-700 font-medium">+{todo.tokens}</span>
                    </button>
                  ))}
                  {todos.length + workTodos.length === 0 && <p className="text-sm text-neutral-400">No todos yet.</p>}
                </div>
              </Card>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Life areas</p>
              <div className="grid grid-cols-3 gap-3">
                {lifeAreas.map((area) => {
                  const score = lifeAreaScores[area.id];
                  const scoreValue = score?.score ?? 0;
                  const status = score?.status ?? 'At Risk';
                  return (
                    <div key={area.id} className="bg-white border border-neutral-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{area.icon}</span>
                        <span className="text-sm font-medium text-neutral-900 flex-1">{area.name}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${getLifeAreaPillClass(status)}`}>{status}</span>
                      </div>
                      <p className="text-2xl font-semibold text-neutral-900">{scoreValue}</p>
                      <div className="h-1 rounded-full bg-neutral-200 mt-2 overflow-hidden">
                        <div className={`h-full ${getLifeAreaBarClass(status)}`} style={{ width: `${Math.min(scoreValue, 100)}%` }} />
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">{scoreValue} / 100</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!isDesktop && (
        <>
        {/* Desktop-only: Dashboard title + KPI cards */}
        <div className="hidden lg:block mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Home className="w-4 h-4 text-accent" />
              </div>
              <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
            </div>
            <span className="text-sm text-accent font-medium">Overview</span>
          </div>
        </div>
        <div className="hidden lg:grid lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl bg-gradient-to-br from-accent to-accent-dark p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p className="text-sm font-medium text-white/90">Level</p>
            <p className="text-2xl font-bold mt-1">{level}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p className="text-sm font-medium text-white/90">Actions today</p>
            <p className="text-2xl font-bold mt-1">{actionsToday} / 3</p>
            <p className="text-xs text-white/80 mt-1">{goalMet ? 'Goal met' : 'Keep going'}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p className="text-sm font-medium text-white/90">Daily streak</p>
            <p className="text-2xl font-bold mt-1">{todayStats?.streak ?? 0}</p>
            <p className="text-xs text-white/80 mt-1">days</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p className="text-sm font-medium text-white/90">Tokens today</p>
            <p className="text-2xl font-bold mt-1">+{todayStats?.tokens_earned ?? 0}</p>
            <p className="text-xs text-white/80 mt-1">earned</p>
          </div>
        </div>

        {/* Weekly Review Banner */}
        {weeklyReviewPending && (
          <button
            onClick={() => router.push('/review')}
            className="w-full bg-gradient-to-r from-accent to-accent-dark rounded-2xl shadow-sm p-4 mb-4 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Your weekly review is ready</p>
                  <p className="text-xs text-white/80 mt-0.5">Reflect on your week</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Header / Summary Card */}
        <Card>
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Today</h1>
            <p className="text-sm text-neutral-500">{getDateLabel()}</p>
          </div>

          {/* Daily Progress */}
          <div className="space-y-3">
            <ProgressBar current={actionsToday} total={3} />
            <div className="flex items-center gap-4">
              {todayStats && todayStats.streak > 0 && (
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-neutral-900">
                    {todayStats.streak}
                  </span>
                </div>
              )}
              {todayStats && todayStats.tokens_earned > 0 && (
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-neutral-900">
                    +{todayStats.tokens_earned} today
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-neutral-500">Lv {level}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Add */}
        <Card>
          <SectionHeader title="Quick Add" />
          <div className="mb-4">
            <div className="flex gap-2 bg-neutral-100 rounded-xl p-1">
              {(['todo', 'work', 'habit', 'lift'] as QuickAddMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setQuickAddMode(mode)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    quickAddMode === mode
                      ? 'bg-white text-accent shadow-sm'
                      : 'text-neutral-600'
                  }`}
                >
                  {mode === 'todo' ? 'To Do' : mode === 'work' ? 'Work' : mode === 'habit' ? 'Habit' : 'Lift'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {quickAddMode === 'lift' ? (
              <>
                <select
                  value={quickAddLiftId || ''}
                  onChange={(e) => setQuickAddLiftId(e.target.value || null)}
                  className="w-full px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select lift...</option>
                  {lifts.map((lift) => (
                    <option key={lift.id} value={lift.id}>
                      {lift.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Weight"
                    value={quickAddWeight}
                    onChange={(e) => setQuickAddWeight(e.target.value)}
                    enterKeyHint="done"
                    className="flex-1 px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Reps"
                    value={quickAddReps}
                    onChange={(e) => setQuickAddReps(e.target.value)}
                    enterKeyHint="done"
                    className="flex-1 px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </>
            ) : quickAddMode === 'habit' ? (
              <select
                value={quickAddLifeAreaId || ''}
                onChange={(e) => setQuickAddLifeAreaId(e.target.value || null)}
                className="w-full px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">No Life Area</option>
                {lifeAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.icon} {area.name}
                  </option>
                ))}
              </select>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder={quickAddMode === 'lift' ? 'Notes (optional)' : 'Title...'}
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickAdd();
                }}
                enterKeyHint="done"
                className="flex-1 min-w-0 px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex gap-2 items-center flex-shrink-0">
                {quickAddMode !== 'lift' && (
                  <div className="flex gap-1">
                    {tokenOptions.map((tokens) => (
                      <button
                        key={tokens}
                        onClick={() => setQuickAddTokens(tokens)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                          quickAddTokens === tokens
                            ? 'bg-accent text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        +{tokens}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleQuickAdd}
                  disabled={pendingQuickAdd}
                  className="px-4 py-2 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center gap-1 text-sm whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Habits */}
        {habits.length > 0 && (
          <Card>
            <SectionHeader
              title="Today's Habits"
              action={
                <button
                  onClick={() => router.push('/habits')}
                  className="text-sm text-accent font-medium"
                >
                  View all
                </button>
              }
            />
            <div className="grid grid-cols-2 gap-3">
              {habits.slice(0, 6).map((habit) => {
                const isCompleted = habitCompletions[habit.id]?.has(today) || false;
                return (
                  <button
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit)}
                    disabled={pendingToggles.has(habit.id)}
                    className={`p-3 rounded-xl text-left transition-all duration-120 touch-target ${
                      isCompleted
                        ? 'bg-green-50 border-2 border-green-200'
                        : 'bg-neutral-50 border-2 border-transparent hover:border-accent'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-neutral-900 line-clamp-1 block">
                          {habit.title}
                        </span>
                        {isCompleted && (
                          <span className="text-xs text-neutral-400 mt-0.5 block">completed today</span>
                        )}
                      </div>
                      {isCompleted && (
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 completion-feedback" />
                      )}
                    </div>
                    {habit.tokens > 0 && (
                      <Pill variant="warning" size="sm">
                        +{habit.tokens}
                      </Pill>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* To Dos */}
        {(todos.length > 0 || workTodos.length > 0) && (
          <div className="space-y-4">
            {todos.length > 0 && (
              <Card>
                <SectionHeader
                  title="Personal To Dos"
                  action={
                    <button
                      onClick={() => router.push('/todo')}
                      className="text-sm text-accent font-medium"
                    >
                      View all
                    </button>
                  }
                />
                <div className="space-y-2">
                  {todos.slice(0, 5).map((todo) => (
                    <button
                      key={todo.id}
                      onClick={() => handleToggleTodo(todo)}
                      disabled={pendingToggles.has(todo.id)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-all duration-150 w-full text-left touch-target min-h-[44px]"
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-120 ${
                          todo.completed 
                            ? 'border-green-300 bg-green-50 scale-100' 
                            : 'border-neutral-300 scale-95'
                        }`}
                      >
                        {todo.completed && (
                          <Check className="w-3 h-3 text-accent completion-feedback" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-neutral-900 block">{todo.title}</span>
                        <span className="text-xs text-neutral-400 mt-0.5 block">
                          {getRelativeTimeText(todo.created_at)}
                        </span>
                      </div>
                      {todo.tokens > 0 && (
                        <Pill variant="warning" size="sm" className="flex-shrink-0">
                          +{todo.tokens}
                        </Pill>
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {workTodos.length > 0 && (
              <Card>
                <SectionHeader
                  title="Work To Dos"
                  action={
                    <button
                      onClick={() => router.push('/work')}
                      className="text-sm text-accent font-medium"
                    >
                      View all
                    </button>
                  }
                />
                <div className="space-y-2">
                  {workTodos.slice(0, 5).map((todo) => (
                    <button
                      key={todo.id}
                      onClick={() => handleToggleWorkTodo(todo)}
                      disabled={pendingToggles.has(todo.id)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-all duration-150 w-full text-left touch-target min-h-[44px]"
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-120 ${
                          todo.completed 
                            ? 'border-green-300 bg-green-50 scale-100' 
                            : 'border-neutral-300 scale-95'
                        }`}
                      >
                        {todo.completed && (
                          <Check className="w-3 h-3 text-accent completion-feedback" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-neutral-900 block">{todo.title}</span>
                        <span className="text-xs text-neutral-400 mt-0.5 block">
                          {todo.completed_at 
                            ? getRelativeTimeText(todo.completed_at)
                            : getRelativeTimeText(todo.created_at)}
                        </span>
                      </div>
                      {todo.tokens > 0 && (
                        <Pill variant="warning" size="sm" className="flex-shrink-0">
                          +{todo.tokens}
                        </Pill>
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Edit List Quick View */}
        {editItems.length > 0 && (
          <Card>
            <SectionHeader
              title="Edit List"
              action={
                <button
                  onClick={() => router.push('/work')}
                  className="text-sm text-accent font-medium"
                >
                  View all
                </button>
              }
            />
            <div className="space-y-2">
              {editItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 min-w-0 transition-all duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-neutral-900 truncate block">{item.title}</span>
                    <span className="text-xs text-neutral-400 mt-0.5 block">
                      {getRelativeTimeText(item.created_at)}
                    </span>
                  </div>
                  <Pill variant="neutral" size="sm" className="flex-shrink-0">
                    {item.type === 'short_form' ? 'Short' : item.type === 'long_form' ? 'Long' : 'Episode'}
                  </Pill>
                  <button
                    onClick={() => handleCycleEditStatus(item)}
                    disabled={pendingToggles.has(item.id)}
                    className="flex-shrink-0"
                  >
                    <Pill
                      variant={
                        item.status === 'done'
                          ? 'success'
                          : item.status === 'in_progress'
                          ? 'accent'
                          : 'neutral'
                      }
                      size="sm"
                      className="whitespace-nowrap transition-all duration-120 disabled:opacity-50"
                    >
                      {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In Progress' : 'Queued'}
                    </Pill>
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse mb-3"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2 animate-pulse"></div>
              </Card>
            ))}
          </div>
        )}

        {/* Life Areas */}
        {lifeAreas.length > 0 && (
          <Card>
            <SectionHeader title="Life Areas" />
            <div className="grid grid-cols-2 gap-3">
              {lifeAreas.map((area) => {
                const score = lifeAreaScores[area.id];
                const scoreValue = score?.score ?? 0;
                const status = score?.status ?? 'At Risk';
                
                return (
                  <div
                    key={area.id}
                    className="p-4 rounded-xl bg-neutral-50 border-2 border-transparent"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{area.icon}</span>
                      <h3 className="font-semibold text-neutral-900 text-sm">{area.name}</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-neutral-900">{scoreValue}</span>
                        <Pill
                          variant={
                            status === 'Excellent'
                              ? 'success'
                              : status === 'Good'
                              ? 'accent'
                              : status === 'Okay'
                              ? 'warning'
                              : 'warning'
                          }
                          className="text-xs"
                        >
                          {status}
                        </Pill>
                      </div>
                      <ProgressBar current={scoreValue} total={100} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Empty State - Only show if truly nothing exists, very subtle */}
        {!loading && habits.length === 0 && todos.length === 0 && workTodos.length === 0 && editItems.length === 0 && lifeAreas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-400">
              Start by adding something above.
            </p>
          </div>
        )}
        </>
        )}
      </AnimateStagger>
    </AppShell>
  );
}
