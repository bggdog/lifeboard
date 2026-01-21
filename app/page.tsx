'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus, Flame } from 'lucide-react';
import AppShell from '@/components/AppShell';
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
import { fetchLifeAreas, type LifeArea } from '@/lib/lifeAreas';
import { supabase } from '@/lib/supabase/client';

type QuickAddMode = 'todo' | 'work' | 'habit' | 'lift';

export default function TodayPage() {
  const router = useRouter();
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
  const [todayStats, setTodayStats] = useState<{ actions_completed: number; tokens_earned: number; streak: number } | null>(null);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

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
      
      // Remove if completed
      if (newCompleted) {
        setTodos((prev) => prev.filter((t) => t.id !== todo.id));
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
      
      // Remove if completed
      if (newCompleted) {
        setWorkTodos((prev) => prev.filter((t) => t.id !== todo.id));
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

  return (
    <AppShell>
      <div className="p-6 space-y-4 pb-24">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
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
                  <span className="text-sm">🪙</span>
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
                    placeholder="Weight"
                    value={quickAddWeight}
                    onChange={(e) => setQuickAddWeight(e.target.value)}
                    className="flex-1 px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={quickAddReps}
                    onChange={(e) => setQuickAddReps(e.target.value)}
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

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={quickAddMode === 'lift' ? 'Notes (optional)' : 'Title...'}
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickAdd();
                }}
                className="flex-1 px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {quickAddMode !== 'lift' && (
                <div className="flex gap-1">
                  {tokenOptions.map((tokens) => (
                    <button
                      key={tokens}
                      onClick={() => setQuickAddTokens(tokens)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
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
                className="px-4 py-2 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
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
                    className={`p-3 rounded-xl text-left transition-all ${
                      isCompleted
                        ? 'bg-green-50 border-2 border-green-200'
                        : 'bg-neutral-50 border-2 border-transparent hover:border-accent'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-900 line-clamp-1">
                        {habit.title}
                      </span>
                      {isCompleted && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
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
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50"
                    >
                      <button
                        onClick={() => handleToggleTodo(todo)}
                        disabled={pendingToggles.has(todo.id)}
                        className="flex-shrink-0 w-5 h-5 rounded border-2 border-neutral-300 flex items-center justify-center disabled:opacity-50"
                      >
                        {todo.completed && <Check className="w-3 h-3 text-accent" />}
                      </button>
                      <span className="flex-1 text-sm text-neutral-900">{todo.title}</span>
                      {todo.tokens > 0 && (
                        <Pill variant="warning" size="sm">
                          +{todo.tokens}
                        </Pill>
                      )}
                    </div>
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
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50"
                    >
                      <button
                        onClick={() => handleToggleWorkTodo(todo)}
                        disabled={pendingToggles.has(todo.id)}
                        className="flex-shrink-0 w-5 h-5 rounded border-2 border-neutral-300 flex items-center justify-center disabled:opacity-50"
                      >
                        {todo.completed && <Check className="w-3 h-3 text-accent" />}
                      </button>
                      <span className="flex-1 text-sm text-neutral-900">{todo.title}</span>
                      {todo.tokens > 0 && (
                        <Pill variant="warning" size="sm">
                          +{todo.tokens}
                        </Pill>
                      )}
                    </div>
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
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50"
                >
                  <span className="flex-1 text-sm text-neutral-900">{item.title}</span>
                  <Pill variant="neutral" size="sm">
                    {item.type === 'short_form' ? 'Short' : item.type === 'long_form' ? 'Long' : 'Episode'}
                  </Pill>
                  <button
                    onClick={() => handleCycleEditStatus(item)}
                    disabled={pendingToggles.has(item.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      item.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In Progress' : 'Queued'}
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

        {/* Empty State */}
        {!loading && habits.length === 0 && todos.length === 0 && workTodos.length === 0 && editItems.length === 0 && (
          <Card>
            <p className="text-center text-neutral-500 py-4">
              Get started by adding a habit or todo above!
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
