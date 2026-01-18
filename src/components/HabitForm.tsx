import { useState } from 'react';
import { Habit } from '../types';

interface HabitFormProps {
  habit?: Habit;
  onSave: (habit: Habit) => void;
  onCancel: () => void;
}

const HabitForm = ({ habit, onSave, onCancel }: HabitFormProps) => {
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [tokenReward, setTokenReward] = useState(habit?.tokenReward || 5);
  const [category, setCategory] = useState(habit?.category || '');
  const [schedule, setSchedule] = useState(habit?.schedule || 'daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habitData: Habit = {
      id: habit?.id || `habit-${Date.now()}-${Math.random()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      tokenReward,
      category: category.trim() || undefined,
      schedule,
      createdAt: habit?.createdAt || new Date().toISOString(),
      archived: habit?.archived || false,
    };

    onSave(habitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Habit name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input"
        required
        autoFocus
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input min-h-[80px] resize-none"
        rows={3}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            💰 Reward
          </label>
          <input
            type="number"
            value={tokenReward}
            onChange={(e) => setTokenReward(parseInt(e.target.value) || 0)}
            className="input"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Schedule
          </label>
          <select
            value={schedule}
            onChange={(e) => setSchedule(e.target.value as any)}
            className="input"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      <input
        type="text"
        placeholder="Category (optional)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="input"
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          Save
        </button>
      </div>
    </form>
  );
};

export default HabitForm;
