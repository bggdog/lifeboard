import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Reward } from '../types';
import { X, Plus, Gift, History, Trash2, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RewardsStoreProps {
  onClose: () => void;
}

const getRewardEmoji = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('golf')) return '⛳';
  if (lowerName.includes('chicken') || lowerName.includes('steak') || lowerName.includes('roadhouse')) return '🍗';
  if (lowerName.includes('video game') || lowerName.includes('game')) return '🎮';
  if (lowerName.includes('basketball') || lowerName.includes('shootaround')) return '🏀';
  if (lowerName.includes('movie')) return '🎬';
  return '🎁';
};

const REWARD_COLORS = [
  { bg: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-300/40', text: 'text-emerald-700' },
  { bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-300/40', text: 'text-amber-700' },
  { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-300/40', text: 'text-blue-700' },
  { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-300/40', text: 'text-purple-700' },
  { bg: 'from-rose-500/20 to-red-500/20', border: 'border-rose-300/40', text: 'text-rose-700' },
  { bg: 'from-indigo-500/20 to-violet-500/20', border: 'border-indigo-300/40', text: 'text-indigo-700' },
  { bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-300/40', text: 'text-green-700' },
  { bg: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-300/40', text: 'text-yellow-700' },
];

const RewardsStore = ({ onClose }: RewardsStoreProps) => {
  const { state, addReward, deleteReward, redeemReward, updateReward } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardDescription, setNewRewardDescription] = useState('');
  const [newRewardPrice, setNewRewardPrice] = useState(500);

  const handleAddReward = async () => {
    if (!newRewardName.trim()) return;

    const reward: Reward = {
      id: `reward-${Date.now()}-${Math.random()}`,
      name: newRewardName.trim(),
      description: newRewardDescription.trim() || undefined,
      price: newRewardPrice,
      createdAt: new Date().toISOString(),
    };

    await addReward(reward);
    setNewRewardName('');
    setNewRewardDescription('');
    setNewRewardPrice(500);
    setShowAddForm(false);
  };

  const handleRedeem = async (reward: Reward) => {
    if (state.tokenBalance < reward.price) {
      alert(`You need ${reward.price - state.tokenBalance} more 💰 to redeem this reward.`);
      return;
    }

    if (!confirm(`Redeem "${reward.name}" for ${reward.price} 💰?`)) {
      return;
    }

    await redeemReward(reward);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this reward?')) {
      await deleteReward(id);
    }
  };

  const sortedRedemptions = [...state.redemptions].sort(
    (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-card max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Rewards Store</h2>
              <div className="text-sm text-neutral-600">
                Balance: <span className="font-semibold text-yellow-600">{state.tokenBalance}</span> <span className="text-yellow-600">💰</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
              title="Redemption history"
            >
              <History className="w-5 h-5 text-neutral-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {showHistory ? (
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Redemption History</h3>
              {sortedRedemptions.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Gift className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p>No redemptions yet. Start earning 💰 and redeem your first reward!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedRedemptions.map((redemption) => (
                    <div
                      key={redemption.id}
                      className="p-4 bg-neutral-50 rounded-card border border-neutral-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-neutral-900">{redemption.rewardName}</div>
                          <div className="text-sm text-neutral-600 mt-1">
                            {format(parseISO(redemption.redeemedAt), 'MMM d, yyyy • h:mm a')}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-neutral-700">
                          -{redemption.price} <span className="text-yellow-600">💰</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-900">Available Rewards</h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Reward
                </button>
              </div>

              {showAddForm && (
                <div className="mb-6 p-4 bg-neutral-50 rounded-card space-y-3">
                  <input
                    type="text"
                    placeholder="Reward name (e.g., Round of golf, New book)"
                    value={newRewardName}
                    onChange={(e) => setNewRewardName(e.target.value)}
                    className="input"
                    autoFocus
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newRewardDescription}
                    onChange={(e) => setNewRewardDescription(e.target.value)}
                    className="input min-h-[80px] resize-none"
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="💰 Price"
                      value={newRewardPrice}
                      onChange={(e) => setNewRewardPrice(parseInt(e.target.value) || 0)}
                      className="input flex-1"
                      min="1"
                    />
                    <button onClick={handleAddReward} className="btn-primary">
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewRewardName('');
                        setNewRewardDescription('');
                        setNewRewardPrice(500);
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {state.rewards.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Gift className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p className="mb-4">No rewards yet. Create your first reward!</p>
                  <button onClick={() => setShowAddForm(true)} className="btn-primary">
                    Create Reward
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.rewards.map((reward, index) => {
                    const canAfford = state.tokenBalance >= reward.price;
                    const colorScheme = REWARD_COLORS[index % REWARD_COLORS.length];
                    const emoji = getRewardEmoji(reward.name);
                    
                    return (
                      <div
                        key={reward.id}
                        className={`group relative p-6 rounded-card border-2 transition-all hover:scale-[1.02] ${
                          canAfford
                            ? `bg-gradient-to-br ${colorScheme.bg} ${colorScheme.border} hover:shadow-card cursor-pointer`
                            : 'bg-neutral-50 border-neutral-200 opacity-60'
                        }`}
                      >
                        {editingReward?.id === reward.id ? (
                          <RewardEditForm
                            reward={reward}
                            onSave={async (updated) => {
                              await updateReward(updated);
                              setEditingReward(null);
                            }}
                            onCancel={() => setEditingReward(null)}
                          />
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-3">
                              <div className="text-4xl">{emoji}</div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditingReward(reward)}
                                  className="p-1.5 rounded-button hover:bg-white/50 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-neutral-600" />
                                </button>
                                <button
                                  onClick={() => handleDelete(reward.id)}
                                  className="p-1.5 rounded-button hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                            <div className="font-semibold text-lg text-neutral-900 mb-1">
                              {reward.name}
                            </div>
                            {reward.description && (
                              <div className="text-sm text-neutral-600 mb-4">
                                {reward.description}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200/50">
                              <div className={`text-xl font-bold ${colorScheme.text}`}>
                                {reward.price} <span className="text-yellow-600">💰</span>
                              </div>
                              <button
                                onClick={() => handleRedeem(reward)}
                                disabled={!canAfford}
                                className={`px-4 py-2 rounded-button font-medium transition-all ${
                                  canAfford
                                    ? `bg-accent text-white hover:bg-accent-dark shadow-soft`
                                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                }`}
                              >
                                Redeem
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface RewardEditFormProps {
  reward: Reward;
  onSave: (reward: Reward) => void;
  onCancel: () => void;
}

const RewardEditForm = ({ reward, onSave, onCancel }: RewardEditFormProps) => {
  const [name, setName] = useState(reward.name);
  const [description, setDescription] = useState(reward.description || '');
  const [price, setPrice] = useState(reward.price);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...reward,
      name: name.trim(),
      description: description.trim() || undefined,
      price,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input text-sm"
        required
        autoFocus
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input text-sm min-h-[60px] resize-none"
        rows={2}
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
        className="input text-sm"
        min="1"
        required
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm flex-1">
          Cancel
        </button>
        <button type="submit" className="btn-primary text-sm flex-1">
          Save
        </button>
      </div>
    </form>
  );
};

export default RewardsStore;
