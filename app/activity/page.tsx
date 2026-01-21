'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { getOrCreateProfile } from '@/lib/profile';
import { fetchRecentActivity, formatActivityEvent, type ActivityEvent } from '@/lib/activity';

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivity() {
      try {
        setLoading(true);
        setError(null);
        const profile = await getOrCreateProfile();
        const activityData = await fetchRecentActivity(profile.id, 20);
        setActivities(activityData);
      } catch (err: any) {
        console.error('Error loading activity:', err);
        setError(err?.message || 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, []);

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Activity</h1>
          <p className="text-sm text-neutral-500">Recent token transactions</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
              >
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Activity List */}
        {!loading && activities.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-neutral-500">No activity yet. Complete some tasks to see activity here!</p>
          </div>
        )}

        {!loading && activities.length > 0 && (
          <div className="space-y-3">
            {activities.map((event) => {
              const isPositive = event.delta > 0;
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl shadow-sm p-4"
                >
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-base font-medium ${
                        isPositive ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {formatActivityEvent(event)}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        isPositive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {event.delta > 0 ? '+' : ''}
                      {event.delta}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
