'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Card from '@/components/ui/Card';
import { getOrCreateProfile } from '@/lib/profile';
import { applyPassiveDecay } from '@/lib/lifeDecay';
import {
  getWeekRange,
  generateWeeklyReview,
  saveWeeklyReview,
  completeWeeklyReview,
  getLastWeekIncompleteReview,
  type WeeklyReviewSummary,
} from '@/lib/weeklyReview';
import { fetchLifeAreas, type LifeArea } from '@/lib/lifeAreas';

export default function ReviewPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<WeeklyReviewSummary | null>(null);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const profile = await getOrCreateProfile();
        setProfileId(profile.id);

        // Apply passive decay first
        await applyPassiveDecay(profile.id);

        // Check for incomplete review from last week
        const lastWeekReview = await getLastWeekIncompleteReview(profile.id);
        
        if (lastWeekReview) {
          // Load existing review data
          const summary = await generateWeeklyReview(profile.id, lastWeekReview.week_start);
          setReviewData(summary);
          setReflection(lastWeekReview.reflection || '');
        } else {
          // Generate new review for last week
          const today = new Date();
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          const { weekStart } = getWeekRange(lastWeek);
          
          const summary = await generateWeeklyReview(profile.id, weekStart);
          setReviewData(summary);
          
          // Save the review
          await saveWeeklyReview(profile.id, weekStart, summary);
        }

        // Fetch life areas for icons
        const areas = await fetchLifeAreas(profile.id);
        setLifeAreas(areas);
      } catch (err: any) {
        console.error('Error loading review data:', err);
        setError(err?.message || 'Failed to load review data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleCloseWeek = async () => {
    if (!profileId || !reviewData || saving) return;

    setSaving(true);
    try {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const { weekStart } = getWeekRange(lastWeek);

      // Save review with reflection
      await saveWeeklyReview(profileId, weekStart, {
        ...reviewData,
        reflection: reflection.trim() || null,
      });

      // Mark as completed
      await completeWeeklyReview(profileId, weekStart);

      setCompleted(true);

      // Navigate back after a moment
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      console.error('Error closing week:', err);
      setError(err?.message || 'Failed to close week');
    } finally {
      setSaving(false);
    }
  };

  const getLifeAreaIcon = (areaName: string): string => {
    const area = lifeAreas.find((a) => a.name === areaName);
    return area?.icon || '✨';
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-4 sm:p-6 space-y-4 pb-24">
          <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error && !reviewData) {
    return (
      <AppShell>
        <div className="p-4 sm:p-6 space-y-4 pb-24">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!reviewData) {
    return (
      <AppShell>
        <div className="p-4 sm:p-6 space-y-4 pb-24">
          <Card>
            <div className="text-center py-8">
              <p className="text-neutral-500 text-sm">No review needed at this time.</p>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 space-y-4 pb-24 overflow-x-hidden">
        {/* Intro Card */}
        <Card>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Weekly Review</h1>
            <p className="text-sm text-neutral-500">This is a moment to reflect, not judge.</p>
          </div>
        </Card>

        {/* Summary Card */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Week Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getLifeAreaIcon(reviewData.strongest_area)}</span>
                <div>
                  <p className="text-xs text-neutral-500">Strongest Area</p>
                  <p className="text-sm font-medium text-neutral-900">{reviewData.strongest_area}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getLifeAreaIcon(reviewData.weakest_area)}</span>
                <div>
                  <p className="text-xs text-neutral-500">Focus Area</p>
                  <p className="text-sm font-medium text-neutral-900">{reviewData.weakest_area}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="text-center p-3 bg-neutral-50 rounded-xl">
                <p className="text-2xl font-semibold text-neutral-900">{reviewData.total_actions}</p>
                <p className="text-xs text-neutral-500 mt-1">Actions</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-xl">
                <p className="text-2xl font-semibold text-neutral-900">{reviewData.total_tokens}</p>
                <p className="text-xs text-neutral-500 mt-1">Tokens</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Consistency Card */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Consistency</h2>
          <div className="space-y-3">
            <div className="p-4 bg-neutral-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-900">Days you met your goal</span>
                <span className="text-lg font-semibold text-neutral-900">
                  {reviewData.days_met_goal} / 7
                </span>
              </div>
              {reviewData.missed_days_count > 0 && (
                <p className="text-xs text-neutral-500 mt-2">
                  {reviewData.missed_days_count} day{reviewData.missed_days_count !== 1 ? 's' : ''} missed
                </p>
              )}
            </div>
            <p className="text-xs text-neutral-400 text-center italic">
              Progress over perfection.
            </p>
          </div>
        </Card>

        {/* Reflection Card */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Reflection</h2>
          <div className="space-y-3">
            <div className="space-y-2 text-sm text-neutral-600">
              <p>• What worked well this week?</p>
              <p>• What felt heavy?</p>
              <p>• What's one small thing you'll focus on next week?</p>
            </div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Your thoughts..."
              rows={6}
              className="w-full px-4 py-3 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Close Week Button */}
        {completed ? (
          <Card>
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-neutral-900">Week closed!</p>
            </div>
          </Card>
        ) : (
          <button
            onClick={handleCloseWeek}
            disabled={saving}
            className="w-full px-6 py-4 bg-accent text-white rounded-2xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              'Closing...'
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Close the Week
              </>
            )}
          </button>
        )}
      </div>
    </AppShell>
  );
}
