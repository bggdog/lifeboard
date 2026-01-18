import { useApp } from '../../context/AppContext';
import { Gift, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import RewardsStore from '../RewardsStore';

const getRewardEmoji = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('golf')) return '⛳';
  if (lowerName.includes('chicken') || lowerName.includes('steak') || lowerName.includes('roadhouse')) return '🍗';
  if (lowerName.includes('video game') || lowerName.includes('game')) return '🎮';
  if (lowerName.includes('basketball') || lowerName.includes('shootaround')) return '🏀';
  if (lowerName.includes('movie')) return '🎬';
  return '🎁';
};

const RewardsShortcutModule = () => {
  const { state } = useApp();
  const [showStore, setShowStore] = useState(false);

  const affordableRewards = state.rewards.filter(r => r.price <= state.tokenBalance).slice(0, 3);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-neutral-900">Rewards</h3>
          </div>
          <button
            onClick={() => setShowStore(true)}
            className="text-sm text-accent hover:text-accent-dark font-medium flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {affordableRewards.length === 0 ? (
          <div className="text-center py-6 text-neutral-500">
            <p className="mb-2">No rewards available yet.</p>
            <button
              onClick={() => setShowStore(true)}
              className="text-sm text-accent hover:text-accent-dark font-medium"
            >
              Create your first reward
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {affordableRewards.map((reward) => {
              const emoji = getRewardEmoji(reward.name);
              return (
                <div
                  key={reward.id}
                  className="p-3 bg-gradient-to-r from-accent/5 to-accent/10 rounded-button border border-accent/20 flex items-center gap-3"
                >
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-neutral-900">{reward.name}</div>
                    <div className="text-sm text-neutral-600 mt-0.5">
                      {reward.price} <span className="text-yellow-600">💰</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showStore && <RewardsStore onClose={() => setShowStore(false)} />}
    </>
  );
};

export default RewardsShortcutModule;
