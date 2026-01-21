'use client';

import { useState, useEffect } from 'react';
import { Plus, Gift, Flame } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getOrCreateProfile } from '@/lib/profile';
import { getTokenBalance } from '@/lib/tokens';
import { tokenStore } from '@/lib/tokenStore';
import { levelFromXp } from '@/lib/game/xp';
import { fetchTodayStats, type DailyStats } from '@/lib/game/daily';
import { fetchRewards, createReward, redeemReward, fetchRecentRedemptions, type Reward, type RewardRedemption } from '@/lib/game/rewards';
import { supabase } from '@/lib/supabase/client';

export default function GamePage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile stats
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [tokenBalance, setTokenBalance] = useState(0);

  // Daily stats
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);

  // Rewards
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');
  const [newRewardIcon, setNewRewardIcon] = useState('');
  const [pendingRedeems, setPendingRedeems] = useState<Set<string>>(new Set());

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
        setTokenBalance(balance);

        // Load profile XP and level
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('xp, level')
          .eq('id', profile.id)
          .single();

        if (!profileError && profileData) {
          const currentXp = profileData.xp ?? 0;
          const currentLevel = profileData.level ?? 1;
          setXp(currentXp);
          setLevel(currentLevel);
        }

        // Load today's stats
        const stats = await fetchTodayStats(profile.id);
        setTodayStats(stats);

        // Load rewards and redemptions
        const [rewardsData, redemptionsData] = await Promise.all([
          fetchRewards(profile.id),
          fetchRecentRedemptions(profile.id, 10),
        ]);

        setRewards(rewardsData);
        setRedemptions(redemptionsData);

        // Subscribe to token balance changes
        const unsubscribe = tokenStore.subscribe((balance) => {
          setTokenBalance(balance);
        });

        return unsubscribe;
      } catch (err: any) {
        console.error('Error loading game data:', err);
        const errorMessage = err?.message || 'Failed to load game data';
        
        if (errorMessage.includes('does not exist') || 
            errorMessage.includes('schema cache') ||
            (errorMessage.includes('relation') && errorMessage.includes('does not exist'))) {
          setError('Game tables not found. Please run CREATE_GAME_TABLES.sql in Supabase SQL Editor first.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle create reward
  const handleCreateReward = async () => {
    if (!newRewardName.trim() || !newRewardCost || !profileId) return;

    const cost = parseInt(newRewardCost);
    if (isNaN(cost) || cost <= 0) {
      setError('Please enter a valid cost');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const name = newRewardName.trim();
    setNewRewardName('');
    setNewRewardCost('');
    setNewRewardIcon('');

    try {
      const newReward = await createReward(profileId, {
        name,
        costTokens: cost,
        icon: newRewardIcon.trim() || null,
      });
      setRewards((prev) => [newReward, ...prev]);
    } catch (err: any) {
      setError(err?.message || 'Failed to create reward');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle redeem reward
  const handleRedeemReward = async (reward: Reward) => {
    if (pendingRedeems.has(reward.id) || !profileId) return;

    if (tokenBalance < reward.cost_tokens) {
      setError(`Insufficient tokens. Need ${reward.cost_tokens}, have ${tokenBalance}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setPendingRedeems((prev) => new Set(prev).add(reward.id));

    // Optimistic update
    const newBalance = tokenBalance - reward.cost_tokens;
    setTokenBalance(newBalance);
    tokenStore.setBalance(newBalance);

    const optimisticRedemption: RewardRedemption = {
      id: `temp-${Date.now()}`,
      profile_id: profileId,
      reward_id: reward.id,
      redeemed_at: new Date().toISOString(),
      cost_tokens: reward.cost_tokens,
      created_at: new Date().toISOString(),
    };
    setRedemptions((prev) => [optimisticRedemption, ...prev].slice(0, 10));

    try {
      const { redemption, newBalance: actualBalance } = await redeemReward(profileId, reward);
      
      // Replace optimistic redemption with real one
      setRedemptions((prev) => [
        redemption,
        ...prev.filter((r) => r.id !== optimisticRedemption.id),
      ].slice(0, 10));

      // Update token balance
      setTokenBalance(actualBalance);
      tokenStore.setBalance(actualBalance);
    } catch (err: any) {
      // Rollback
      setTokenBalance(tokenBalance);
      tokenStore.setBalance(tokenBalance);
      setRedemptions((prev) => prev.filter((r) => r.id !== optimisticRedemption.id));
      setError(err?.message || 'Failed to redeem reward');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingRedeems((prev) => {
        const next = new Set(prev);
        next.delete(reward.id);
        return next;
      });
    }
  };

  const levelInfo = levelFromXp(xp);
  const actionsToday = todayStats?.actions_completed ?? 0;
  const goalMet = actionsToday >= 3;
  const streak = todayStats?.streak ?? 0;

  return (
    <AppShell>
      <div className="p-6 space-y-4 pb-24">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Game</h1>
          <p className="text-sm text-neutral-500">Level up and earn rewards</p>
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
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
              >
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* Profile Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Level</p>
                  <h2 className="text-4xl font-bold text-neutral-900">{level}</h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-full">
                  <span className="text-lg">🪙</span>
                  <span className="text-sm font-semibold text-yellow-700">
                    {tokenBalance}
                  </span>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                  <span>{levelInfo.xpIntoLevel} / {levelInfo.xpIntoLevel + levelInfo.xpForNext} XP</span>
                  <span>Level {level + 1} in {levelInfo.xpForNext} XP</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-300"
                    style={{
                      width: `${(levelInfo.xpIntoLevel / (levelInfo.xpIntoLevel + levelInfo.xpForNext)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Streak */}
              {streak > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-neutral-900">
                    {streak} day streak
                  </span>
                </div>
              )}
            </div>

            {/* Daily Goal Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-neutral-900">Daily Goal</h3>
                {goalMet && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                    Goal Met!
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-600 mb-3">
                Complete 3 actions per day
              </p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-neutral-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-300"
                    style={{
                      width: `${Math.min((actionsToday / 3) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-neutral-900 min-w-[3rem] text-right">
                  {actionsToday}/3
                </span>
              </div>
            </div>

            {/* Rewards Shop */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Rewards Shop</h3>

              {/* Create Reward */}
              <div className="mb-4 p-4 bg-neutral-50 rounded-xl">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Reward name"
                    value={newRewardName}
                    onChange={(e) => setNewRewardName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white rounded-lg border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="text"
                    placeholder="Icon (emoji)"
                    value={newRewardIcon}
                    onChange={(e) => setNewRewardIcon(e.target.value)}
                    className="w-20 px-3 py-2 bg-white rounded-lg border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Cost (tokens)"
                    value={newRewardCost}
                    onChange={(e) => setNewRewardCost(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white rounded-lg border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    onClick={handleCreateReward}
                    className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-colors flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Rewards List */}
              <div className="space-y-3">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      {reward.icon && (
                        <span className="text-2xl">{reward.icon}</span>
                      )}
                      <div>
                        <p className="font-medium text-neutral-900">{reward.name}</p>
                        <p className="text-sm text-neutral-500">
                          {reward.cost_tokens} tokens
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRedeemReward(reward)}
                      disabled={pendingRedeems.has(reward.id) || tokenBalance < reward.cost_tokens}
                      className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-1"
                    >
                      <Gift className="w-4 h-4" />
                      Redeem
                    </button>
                  </div>
                ))}

                {rewards.length === 0 && (
                  <p className="text-center text-neutral-500 py-4">
                    No rewards yet. Create one above!
                  </p>
                )}
              </div>
            </div>

            {/* Recent Redemptions */}
            {redemptions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Redemptions</h3>
                <div className="space-y-2">
                  {redemptions.map((redemption) => {
                    const reward = rewards.find((r) => r.id === redemption.reward_id);
                    return (
                      <div
                        key={redemption.id}
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {reward?.icon && (
                            <span className="text-xl">{reward.icon}</span>
                          )}
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {reward?.name || 'Unknown Reward'}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {new Date(redemption.redeemed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-neutral-600">
                          -{redemption.cost_tokens} 🪙
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
