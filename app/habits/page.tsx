'use client';

import { useState, useEffect } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { getOrCreateProfile } from '@/lib/profile';
import {
  fetchHabits,
  createHabit,
  toggleHabitForToday,
  deleteHabit,
  type Habit,
} from '@/lib/habits';
import {
  fetchLast7DaysCompletions,
  getLast7Days,
  getToday,
} from '@/lib/habitCompletions';
import { tokenStore } from '@/lib/tokenStore';
import { getTokenBalance } from '@/lib/tokens';
import { fetchLifeAreas, assignHabitToLifeArea, type LifeArea } from '@/lib/lifeAreas';

export default function HabitsPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Record<string, Set<string>>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('');
  const [selectedTokens, setSelectedTokens] = useState(1);
  const [selectedLifeAreaId, setSelectedLifeAreaId] = useState<string | null>(null);
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);

  const today = getToday();
  const last7Days = getLast7Days();

  // Load habits and completions on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const profile = await getOrCreateProfile();
        setProfileId(profile.id);

        // Load habits
        const habitsData = await fetchHabits(profile.id);
        setHabits(habitsData);

        // Load token balance
        const balance = await getTokenBalance(profile.id);
        tokenStore.setBalance(balance);

        // Load life areas
        const areasData = await fetchLifeAreas(profile.id);
        setLifeAreas(areasData);

        // Load completions for last 7 days if we have habits
        if (habitsData.length > 0) {
          const habitIds = habitsData.map((h) => h.id);
          const completionsData = await fetchLast7DaysCompletions(
            profile.id,
            habitIds
          );
          setCompletions(completionsData);
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err?.message || 'Failed to load habits');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle adding a new habit
  const handleAddHabit = async () => {
    if (!newHabitTitle.trim() || !profileId) return;

    const title = newHabitTitle.trim();
    const category = newHabitCategory.trim() || null;
    const lifeAreaId = selectedLifeAreaId;
    setNewHabitTitle('');
    setNewHabitCategory('');
    setSelectedTokens(1);
    setSelectedLifeAreaId(null);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticHabit: Habit = {
      id: tempId,
      profile_id: profileId,
      title,
      category,
      tokens: selectedTokens,
      created_at: new Date().toISOString(),
      active: true,
    };

    setHabits((prev) => [optimisticHabit, ...prev]);
    setCompletions((prev) => ({ ...prev, [tempId]: new Set() }));

    try {
      const newHabit = await createHabit(
        profileId,
        title,
        category,
        selectedTokens,
        selectedLifeAreaId
      );

      // Replace optimistic habit with real one
      setHabits((prev) =>
        prev.map((h) => (h.id === tempId ? newHabit : h))
      );
      setCompletions((prev) => {
        const next = { ...prev };
        delete next[tempId];
        next[newHabit.id] = new Set();
        return next;
      });
    } catch (err: any) {
      // Rollback on error
      setHabits((prev) => prev.filter((h) => h.id !== tempId));
      setCompletions((prev) => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      setError(err?.message || 'Failed to add habit');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle toggling completion for today
  const handleToggleCompletion = async (habit: Habit) => {
    if (pendingToggles.has(habit.id) || !profileId) return;

    const isCompletedToday = completions[habit.id]?.has(today) || false;
    const newCompleted = !isCompletedToday;
    const tokenDelta = newCompleted ? habit.tokens : -habit.tokens;

    // Mark as pending
    setPendingToggles((prev) => new Set(prev).add(habit.id));

    // Optimistic updates
    setCompletions((prev) => {
      const next = { ...prev };
      if (!next[habit.id]) {
        next[habit.id] = new Set();
      }
      if (newCompleted) {
        next[habit.id].add(today);
      } else {
        next[habit.id].delete(today);
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

      // Refresh completions to ensure sync
      const habitIds = [habit.id];
      const updatedCompletions = await fetchLast7DaysCompletions(
        profileId,
        habitIds
      );
      setCompletions((prev) => ({
        ...prev,
        ...updatedCompletions,
      }));

      // Refresh token balance from server to ensure accuracy
      try {
        const balance = await getTokenBalance(profileId);
        tokenStore.setBalance(balance);
      } catch (balanceError) {
        console.error('Error refreshing token balance:', balanceError);
        // Don't fail the whole operation if balance refresh fails
      }
    } catch (err: any) {
      // Rollback on error
      setCompletions((prev) => {
        const next = { ...prev };
        if (!next[habit.id]) {
          next[habit.id] = new Set();
        }
        if (isCompletedToday) {
          next[habit.id].add(today);
        } else {
          next[habit.id].delete(today);
        }
        return next;
      });
      tokenStore.applyDelta(-tokenDelta);
      setError(err?.message || 'Failed to update habit');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(habit.id);
        return next;
      });
    }
  };

  // Handle deleting a habit
  const handleDeleteHabit = async (habit: Habit) => {
    if (deletingId === habit.id) {
      // Confirm deletion
      if (!confirm(`Are you sure you want to delete "${habit.title}"?`)) {
        setDeletingId(null);
        return;
      }

      // Optimistic update
      setHabits((prev) => prev.filter((h) => h.id !== habit.id));
      setCompletions((prev) => {
        const next = { ...prev };
        delete next[habit.id];
        return next;
      });

      try {
        await deleteHabit(habit.id);
      } catch (err: any) {
        // Rollback on error
        setHabits((prev) => [...prev, habit].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        setCompletions((prev) => {
          const next = { ...prev };
          next[habit.id] = new Set();
          return next;
        });
        setError(err?.message || 'Failed to delete habit');
        setTimeout(() => setError(null), 3000);
      } finally {
        setDeletingId(null);
      }
    } else {
      setDeletingId(habit.id);
    }
  };

  const tokenOptions = [1, 2, 3, 5];

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Habits</h1>
          <p className="text-sm text-neutral-500">Tap to complete for today</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Create Habit Input */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Add a habit…"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddHabit();
                }
              }}
              className="flex-1 px-4 py-3 bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleAddHabit}
              className="px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Category, Life Area, and Token Selector */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category (optional)"
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
                className="flex-1 px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedLifeAreaId || ''}
                onChange={(e) => setSelectedLifeAreaId(e.target.value || null)}
                className="flex-1 px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">No Life Area</option>
                {lifeAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.icon} {area.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                {tokenOptions.map((tokens) => (
                  <button
                    key={tokens}
                    onClick={() => setSelectedTokens(tokens)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      selectedTokens === tokens
                        ? 'bg-accent text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    +{tokens}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
              >
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-3"></div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <div
                      key={j}
                      className="w-2 h-2 bg-neutral-200 rounded"
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && habits.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-neutral-500 mb-2">No habits yet.</p>
            <p className="text-sm text-neutral-400">
              Add a habit to start building your routine!
            </p>
          </div>
        )}

        {/* Habit Tiles Grid */}
        {!loading && habits.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {habits.map((habit) => {
              const isCompletedToday =
                completions[habit.id]?.has(today) || false;
              const habitCompletions = completions[habit.id] || new Set();
              const isDeleting = deletingId === habit.id;

              return (
                <div
                  key={habit.id}
                  className={`bg-white rounded-2xl shadow-sm p-4 transition-all ${
                    isCompletedToday
                      ? 'ring-2 ring-accent bg-accent/5'
                      : ''
                  }`}
                >
                  {/* Header with Delete Button */}
                  <div className="flex items-start justify-between mb-3">
                    <button
                      onClick={() => router.push(`/habits/${habit.id}`)}
                      className="flex-1 text-left"
                    >
                      <h3 className="text-base font-semibold text-neutral-900">
                        {habit.title}
                      </h3>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHabit(habit);
                      }}
                      className="flex-shrink-0 p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 ml-2"
                      title={isDeleting ? 'Cancel' : 'Delete habit'}
                    >
                      {isDeleting ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Token Badge and Completion Indicator */}
                  <div className="flex items-center gap-2 mb-3">
                    {isCompletedToday && (
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {habit.tokens > 0 && (
                      <div className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium">
                        +{habit.tokens}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  {habit.category && (
                    <p className="text-xs text-neutral-500 mb-3">
                      {habit.category}
                    </p>
                  )}

                  {/* Last 7 Days Mini Calendar - Clickable to go to detail */}
                  <button
                    onClick={() => router.push(`/habits/${habit.id}`)}
                    className="w-full transition-all active:scale-[0.98]"
                  >
                    <div className="flex gap-1 items-center">
                      {last7Days.map((date, index) => {
                        const isCompleted = habitCompletions.has(date);
                        const isTodayDate = date === today;
                        return (
                          <div
                            key={date}
                            className={`flex-1 aspect-square rounded ${
                              isCompleted
                                ? 'bg-accent'
                                : isTodayDate
                                ? 'bg-neutral-200 border border-neutral-300'
                                : 'bg-neutral-100'
                            }`}
                            title={
                              isTodayDate
                                ? 'Today'
                                : new Date(date).toLocaleDateString()
                            }
                          />
                        );
                      })}
                    </div>
                  </button>
                  
                  {/* Quick toggle button for today */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCompletion(habit);
                    }}
                    disabled={pendingToggles.has(habit.id) || isDeleting}
                    className={`mt-3 w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                      isCompletedToday
                        ? 'bg-accent text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    } ${
                      pendingToggles.has(habit.id) || isDeleting
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {isCompletedToday ? 'Completed Today ✓' : 'Mark Complete'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
