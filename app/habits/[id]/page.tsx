'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getOrCreateProfile } from '@/lib/profile';
import {
  fetchHabit,
  fetchMonthCompletions,
  fetchRangeCompletions,
  toggleHabitOnDate,
} from '@/lib/habitDetail';
import { fetchLifeAreas, assignHabitToLifeArea, type LifeArea } from '@/lib/lifeAreas';
import {
  computeCurrentStreak,
  computeBestStreak,
  computeConsistency,
  getTodayDateString,
  getDateStringDaysAgo,
} from '@/lib/streaks';
import { tokenStore } from '@/lib/tokenStore';
import { getTokenBalance } from '@/lib/tokens';
import type { Habit } from '@/lib/habits';

export default function HabitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const habitId = params.id as string;

  const [habit, setHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [rangeCompletions, setRangeCompletions] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [pendingDates, setPendingDates] = useState<Set<string>>(new Set());
  const [profileId, setProfileId] = useState<string | null>(null);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [editingLifeArea, setEditingLifeArea] = useState(false);

  const today = getTodayDateString();
  const todayDate = new Date();

  // Load habit and completions
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const profile = await getOrCreateProfile();
        setProfileId(profile.id);

        // Load habit
        const habitData = await fetchHabit(profile.id, habitId);
        setHabit(habitData);

        // Load token balance
        const balance = await getTokenBalance(profile.id);
        tokenStore.setBalance(balance);

        // Load life areas
        const areasData = await fetchLifeAreas(profile.id);
        setLifeAreas(areasData);

        // Load current month completions
        const monthCompletions = await fetchMonthCompletions(
          profile.id,
          habitId,
          currentYear,
          currentMonth
        );
        setCompletions(monthCompletions);

        // Load last 120 days for streaks
        const fromDate = getDateStringDaysAgo(120);
        const rangeCompletionsData = await fetchRangeCompletions(
          profile.id,
          habitId,
          fromDate,
          today
        );
        setRangeCompletions(rangeCompletionsData);
      } catch (err: any) {
        console.error('Error loading habit detail:', err);
        setError(err?.message || 'Failed to load habit');
      } finally {
        setLoading(false);
      }
    }

    if (habitId) {
      loadData();
    }
  }, [habitId]);

  // Reload month when month/year changes
  useEffect(() => {
    async function loadMonth() {
      if (!profileId || !habitId) return;

      try {
        const monthCompletions = await fetchMonthCompletions(
          profileId,
          habitId,
          currentYear,
          currentMonth
        );
        setCompletions(monthCompletions);
      } catch (err: any) {
        console.error('Error loading month completions:', err);
      }
    }

    loadMonth();
  }, [currentMonth, currentYear, profileId, habitId]);

  // Calculate stats
  const currentStreak = computeCurrentStreak(rangeCompletions, today);
  const bestStreak = computeBestStreak(rangeCompletions);
  const thirtyDaysAgo = getDateStringDaysAgo(30);
  const consistency = computeConsistency(
    rangeCompletions,
    thirtyDaysAgo,
    today
  );

  // Handle date toggle
  const handleToggleDate = async (dateString: string) => {
    if (!habit || !profileId || pendingDates.has(dateString)) return;

    const isCompleted = completions.has(dateString);
    const newCompleted = !isCompleted;
    const tokenDelta = newCompleted ? habit.tokens : -habit.tokens;

    // Mark as pending
    setPendingDates((prev) => new Set(prev).add(dateString));

    // Optimistic updates
    setCompletions((prev) => {
      const next = new Set(prev);
      if (newCompleted) {
        next.add(dateString);
      } else {
        next.delete(dateString);
      }
      return next;
    });
    setRangeCompletions((prev) => {
      const next = new Set(prev);
      if (newCompleted) {
        next.add(dateString);
      } else {
        next.delete(dateString);
      }
      return next;
    });
    tokenStore.applyDelta(tokenDelta);

    try {
      const result = await toggleHabitOnDate({
        profileId,
        habitId: habit.id,
        dateString,
        title: habit.title,
        tokens: habit.tokens,
      });

      // Refresh token balance if returned
      if (result.newBalance !== undefined) {
        tokenStore.setBalance(result.newBalance);
      }

      // Refresh range completions for accurate stats
      const fromDate = getDateStringDaysAgo(120);
      const updatedRange = await fetchRangeCompletions(
        profileId,
        habitId,
        fromDate,
        today
      );
      setRangeCompletions(updatedRange);
    } catch (err: any) {
      // Rollback on error
      setCompletions((prev) => {
        const next = new Set(prev);
        if (isCompleted) {
          next.add(dateString);
        } else {
          next.delete(dateString);
        }
        return next;
      });
      setRangeCompletions((prev) => {
        const next = new Set(prev);
        if (isCompleted) {
          next.add(dateString);
        } else {
          next.delete(dateString);
        }
        return next;
      });
      tokenStore.applyDelta(-tokenDelta);
      setError(err?.message || 'Failed to update habit');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingDates((prev) => {
        const next = new Set(prev);
        next.delete(dateString);
        return next;
      });
    }
  };

  // Month navigation
  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calendar helpers
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0'
    )}`;
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-neutral-500">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!habit) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-neutral-500">Habit not found</p>
            <button
              onClick={() => router.push('/habits')}
              className="mt-4 text-accent hover:underline"
            >
              Back to Habits
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 pb-24">
        {/* Back Button */}
        <button
          onClick={() => router.push('/habits')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
            {habit.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {habit.category && (
              <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium">
                {habit.category}
              </span>
            )}
            {habit.tokens > 0 && (
              <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
                +{habit.tokens} tokens
              </span>
            )}
            {habit.life_area_id && (
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                {lifeAreas.find((a) => a.id === habit.life_area_id)?.icon || ''}{' '}
                {lifeAreas.find((a) => a.id === habit.life_area_id)?.name || 'Life Area'}
              </span>
            )}
          </div>
          
          {/* Life Area Selector */}
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              Life Area
            </label>
            <select
              value={habit.life_area_id || ''}
              onChange={async (e) => {
                const newLifeAreaId = e.target.value || null;
                try {
                  await assignHabitToLifeArea(habit.id, newLifeAreaId);
                  setHabit({ ...habit, life_area_id: newLifeAreaId });
                } catch (err: any) {
                  console.error('Error assigning life area:', err);
                }
              }}
              className="w-full px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">No Life Area</option>
              {lifeAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.icon} {area.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Streaks Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Streaks
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Current</p>
              <p className="text-3xl font-bold text-accent">{currentStreak}</p>
              <p className="text-xs text-neutral-400 mt-1">days</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Best</p>
              <p className="text-3xl font-bold text-neutral-900">
                {bestStreak}
              </p>
              <p className="text-xs text-neutral-400 mt-1">days</p>
            </div>
          </div>
        </div>

        {/* Consistency Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Consistency
          </h2>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-accent">{consistency}%</p>
            <p className="text-sm text-neutral-500 mb-1">last 30 days</p>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePreviousMonth}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900">
              {monthNames[currentMonth - 1]} {currentYear}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-neutral-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="aspect-square" />;
              }

              const dateString = formatDateString(
                currentYear,
                currentMonth,
                day
              );
              const isCompleted = completions.has(dateString);
              const isToday =
                currentYear === todayDate.getFullYear() &&
                currentMonth === todayDate.getMonth() + 1 &&
                day === todayDate.getDate();
              const isPending = pendingDates.has(dateString);

              return (
                <button
                  key={index}
                  onClick={() => handleToggleDate(dateString)}
                  disabled={isPending}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    isPending
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-neutral-50'
                  } ${
                    isCompleted
                      ? 'bg-accent text-white'
                      : isToday
                      ? 'bg-neutral-100 border-2 border-accent text-neutral-900'
                      : 'bg-neutral-50 text-neutral-700'
                  }`}
                  title={new Date(dateString).toLocaleDateString()}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
