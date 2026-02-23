'use client';

import { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import AnimateStagger from '@/components/ui/AnimateStagger';
import BottomSheet from '@/components/ui/BottomSheet';
import { getOrCreateProfile } from '@/lib/profile';
import { fetchLifts, createLift, type Lift } from '@/lib/gym/lifts';
import { fetchRecentSetsForLifts, createSet, deleteSet, type GymSet } from '@/lib/gym/sets';
import { deriveLiftSummary, formatWeight, estimate1RM } from '@/lib/gym/metrics';
import { tokenStore } from '@/lib/tokenStore';
import { getTokenBalance } from '@/lib/tokens';

export default function GymPage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lifts state
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [newLiftName, setNewLiftName] = useState('');
  const [newLiftCategory, setNewLiftCategory] = useState('');

  // Sets state
  const [setsByLift, setSetsByLift] = useState<Record<string, GymSet[]>>({});
  const [expandedLifts, setExpandedLifts] = useState<Set<string>>(new Set());

  // Log Set state
  const [loggingForLift, setLoggingForLift] = useState<Lift | null>(null);
  const [setWeight, setSetWeight] = useState('');
  const [setReps, setSetReps] = useState('');
  const [setNotes, setSetNotes] = useState('');
  const [pendingSetLog, setPendingSetLog] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());

  // Load data on mount
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

        // Fetch lifts
        const liftsData = await fetchLifts(profile.id);
        setLifts(liftsData);

        // Fetch recent sets for all lifts
        if (liftsData.length > 0) {
          const liftIds = liftsData.map((l) => l.id);
          const setsData = await fetchRecentSetsForLifts(profile.id, liftIds, 5);
          setSetsByLift(setsData);
        }
      } catch (err: any) {
        console.error('Error loading gym data:', err);
        const errorMessage = err?.message || 'Failed to load gym data';
        
        if (errorMessage.includes('does not exist') || 
            errorMessage.includes('schema cache') ||
            (errorMessage.includes('relation') && errorMessage.includes('does not exist'))) {
          setError('Gym tables not found. Please run CREATE_GYM_TABLES.sql in Supabase SQL Editor first.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle add lift
  const handleAddLift = async () => {
    if (!newLiftName.trim() || !profileId) return;

    const name = newLiftName.trim();
    const category = newLiftCategory.trim() || null;
    setNewLiftName('');
    setNewLiftCategory('');

    try {
      const newLift = await createLift(profileId, name, category);
      setLifts((prev) => [...prev, newLift].sort((a, b) => a.name.localeCompare(b.name)));
      // Initialize empty sets array for new lift
      setSetsByLift((prev) => ({ ...prev, [newLift.id]: [] }));
    } catch (err: any) {
      setError(err?.message || 'Failed to add lift');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle log set
  const handleLogSet = async () => {
    if (!loggingForLift || !profileId || pendingSetLog) return;

    const weight = parseFloat(setWeight);
    const reps = parseInt(setReps);

    if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
      setError('Please enter valid weight and reps');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setPendingSetLog(true);

    // Optimistic update
    const optimisticSet: GymSet = {
      id: `temp-${Date.now()}`,
      profile_id: profileId,
      lift_id: loggingForLift.id,
      performed_at: new Date().toISOString(),
      weight,
      reps,
      notes: setNotes.trim() || null,
      tokens: 1,
      created_at: new Date().toISOString(),
    };

    setSetsByLift((prev) => ({
      ...prev,
      [loggingForLift.id]: [optimisticSet, ...(prev[loggingForLift.id] || [])].slice(0, 5),
    }));
    tokenStore.applyDelta(1);

    // Clear form
    setSetWeight('');
    setSetReps('');
    setSetNotes('');
    setLoggingForLift(null);

    try {
      const { set: newSet } = await createSet({
        profileId,
        liftId: loggingForLift.id,
        weight,
        reps,
        notes: setNotes.trim() || null,
        tokens: 1,
      });

      // Replace optimistic set with real one
      setSetsByLift((prev) => ({
        ...prev,
        [loggingForLift.id]: [
          newSet,
          ...(prev[loggingForLift.id] || []).filter((s) => s.id !== optimisticSet.id),
        ].slice(0, 5),
      }));

      // Refresh token balance
      try {
        const balance = await getTokenBalance(profileId);
        tokenStore.setBalance(balance);
      } catch (balanceError) {
        console.error('Error refreshing token balance:', balanceError);
      }
    } catch (err: any) {
      // Rollback
      setSetsByLift((prev) => ({
        ...prev,
        [loggingForLift.id]: (prev[loggingForLift.id] || []).filter((s) => s.id !== optimisticSet.id),
      }));
      tokenStore.applyDelta(-1);
      setError(err?.message || 'Failed to log set');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingSetLog(false);
    }
  };

  // Handle delete set
  const handleDeleteSet = async (set: GymSet, liftId: string) => {
    if (pendingDeletes.has(set.id) || !profileId) return;
    if (!confirm('Delete this set?')) return;

    setPendingDeletes((prev) => new Set(prev).add(set.id));

    // Optimistic update
    setSetsByLift((prev) => ({
      ...prev,
      [liftId]: (prev[liftId] || []).filter((s) => s.id !== set.id),
    }));
    tokenStore.applyDelta(-set.tokens);

    try {
      await deleteSet({
        profileId,
        setId: set.id,
        tokens: set.tokens,
        liftId: set.lift_id,
        weight: set.weight,
        reps: set.reps,
      });

      // Refresh token balance
      try {
        const balance = await getTokenBalance(profileId);
        tokenStore.setBalance(balance);
      } catch (balanceError) {
        console.error('Error refreshing token balance:', balanceError);
      }
    } catch (err: any) {
      // Rollback
      setSetsByLift((prev) => ({
        ...prev,
        [liftId]: [...(prev[liftId] || []), set].sort(
          (a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
        ).slice(0, 5),
      }));
      tokenStore.applyDelta(set.tokens);
      setError(err?.message || 'Failed to delete set');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingDeletes((prev) => {
        const next = new Set(prev);
        next.delete(set.id);
        return next;
      });
    }
  };

  // Toggle expand/collapse
  const toggleExpand = (liftId: string) => {
    setExpandedLifts((prev) => {
      const next = new Set(prev);
      if (next.has(liftId)) {
        next.delete(liftId);
      } else {
        next.add(liftId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <AppShell>
      <AnimateStagger className="p-4 sm:p-6 space-y-4 pb-24 overflow-x-hidden">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Gym</h1>
          <p className="text-sm text-neutral-500">Track your lifts and progress</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Add Lift */}
        <div className="bg-white rounded-2xl shadow-sm p-3">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Add a lift…"
              value={newLiftName}
              onChange={(e) => setNewLiftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddLift();
              }}
              className="w-full px-3 py-2 bg-neutral-50 rounded-lg border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category (optional)"
                value={newLiftCategory}
                onChange={(e) => setNewLiftCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddLift();
                }}
                className="flex-1 px-3 py-2 bg-neutral-50 rounded-lg border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={handleAddLift}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
              >
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Lifts List */}
        {!loading && (
          <div className="space-y-3">
            {lifts.map((lift) => {
              const sets = setsByLift[lift.id] || [];
              const summary = deriveLiftSummary(sets);
              const isExpanded = expandedLifts.has(lift.id);

              return (
                <div key={lift.id} className="bg-white rounded-2xl shadow-sm p-4">
                  {/* Lift Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {lift.name}
                        </h3>
                        {lift.category && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-medium">
                            {lift.category}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-neutral-600">
                        {summary.lastDate && (
                          <p>Last: {formatDate(summary.lastDate)}</p>
                        )}
                        {summary.topSet && (
                          <p>
                            Top set: {formatWeight(summary.topSet.weight)} x {summary.topSet.reps}
                          </p>
                        )}
                        {summary.est1RM && (
                          <p className="font-medium text-neutral-900">
                            Est. 1RM: {summary.est1RM} lbs
                          </p>
                        )}
                        {!summary.lastDate && (
                          <p className="text-neutral-400">No sets logged yet</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setLoggingForLift(lift)}
                      className="flex-1 px-4 py-2 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors text-sm"
                    >
                      Log Set
                    </button>
                    {sets.length > 0 && (
                      <button
                        onClick={() => toggleExpand(lift.id)}
                        className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-xl font-medium hover:bg-neutral-200 transition-colors text-sm flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Recent ({sets.length})
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Recent Sets (Expanded) */}
                  {isExpanded && sets.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-200 space-y-2">
                      {sets.map((set) => (
                        <div
                          key={set.id}
                          className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900">
                              {formatWeight(set.weight)} x {set.reps}
                            </p>
                            {set.notes && (
                              <p className="text-xs text-neutral-500 mt-0.5">{set.notes}</p>
                            )}
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {formatDate(set.performed_at)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteSet(set, lift.id)}
                            disabled={pendingDeletes.has(set.id)}
                            className="p-2 text-neutral-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {lifts.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <p className="text-neutral-500">No lifts yet. Add your first lift above!</p>
              </div>
            )}
          </div>
        )}

        {/* Log Set Bottom Sheet - actions at top so Save is always visible on mobile */}
        <BottomSheet
          isOpen={!!loggingForLift}
          onClose={() => {
            setLoggingForLift(null);
            setSetWeight('');
            setSetReps('');
            setSetNotes('');
          }}
          title={loggingForLift ? `Log Set: ${loggingForLift.name}` : ''}
        >
          <div className="space-y-4">
            {/* Primary actions first so always visible without scrolling */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleLogSet}
                disabled={pendingSetLog}
                className="flex-1 px-4 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
              >
                {pendingSetLog ? 'Saving...' : 'Save Set'}
              </button>
              <button
                onClick={() => {
                  setLoggingForLift(null);
                  setSetWeight('');
                  setSetReps('');
                  setSetNotes('');
                }}
                className="px-4 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-medium hover:bg-neutral-200 transition-colors min-h-[48px] touch-manipulation"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Weight (lbs)
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="225"
                value={setWeight}
                onChange={(e) => setSetWeight(e.target.value)}
                enterKeyHint="next"
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Reps
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="5"
                value={setReps}
                onChange={(e) => setSetReps(e.target.value)}
                enterKeyHint="done"
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                placeholder="How did it feel?"
                value={setNotes}
                onChange={(e) => setSetNotes(e.target.value)}
                rows={2}
                enterKeyHint="done"
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-xl">
              <span className="text-sm font-medium text-yellow-700">
                +1 token
              </span>
            </div>
          </div>
        </BottomSheet>
      </AnimateStagger>
    </AppShell>
  );
}
