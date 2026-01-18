import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { Check, Plus, Edit2, Archive, Trash2, X } from 'lucide-react';
import { Habit } from '../../types';
import HabitForm from '../HabitForm';

const HabitsModule = () => {
  const { state, isHabitCompleted, addHabit, updateHabit, deleteHabit, archiveHabit, completeHabit } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const activeHabits = state.habits.filter(h => !h.archived);
  const displayedHabits = activeHabits;

  const handleComplete = async (habitId: string) => {
    await completeHabit(habitId, today);
  };

  const handleArchive = async (habitId: string) => {
    await archiveHabit(habitId);
  };

  const handleDelete = async (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      await deleteHabit(habitId);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Today's Habits</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
        >
          <Plus className="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-neutral-50 rounded-card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-neutral-900">New Habit</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 rounded-button hover:bg-white transition-colors"
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
          <HabitForm
            onSave={async (habit) => {
              await addHabit(habit);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {editingHabit && (
        <div className="mb-4 p-4 bg-neutral-50 rounded-card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-neutral-900">Edit Habit</h4>
            <button
              onClick={() => setEditingHabit(null)}
              className="p-1 rounded-button hover:bg-white transition-colors"
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
          <HabitForm
            habit={editingHabit}
            onSave={async (habit) => {
              await updateHabit(habit);
              setEditingHabit(null);
            }}
            onCancel={() => setEditingHabit(null)}
          />
        </div>
      )}

      {displayedHabits.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <p>No habits yet. Add your first habit to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedHabits.map((habit) => {
            const completed = isHabitCompleted(habit.id, today);
            return (
              <div
                key={habit.id}
                className={`flex items-center gap-3 p-3 rounded-button transition-all ${
                  completed
                    ? 'bg-accent/5 border border-accent/20'
                    : 'bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                <button
                  onClick={() => handleComplete(habit.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    completed
                      ? 'bg-accent border-accent text-white'
                      : 'border-neutral-300 hover:border-accent'
                  }`}
                >
                  {completed && <Check className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-900">{habit.name}</div>
                  {habit.description && (
                    <div className="text-sm text-neutral-600">{habit.description}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {habit.category && (
                      <span className="text-xs px-2 py-0.5 bg-neutral-200 text-neutral-700 rounded-full">
                        {habit.category}
                      </span>
                    )}
                    <span className="text-xs text-neutral-500">
                      +{habit.tokenReward} <span className="text-yellow-600">💰</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingHabit(habit)}
                    className="p-1.5 rounded-button hover:bg-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-neutral-600" />
                  </button>
                  <button
                    onClick={() => handleArchive(habit.id)}
                    className="p-1.5 rounded-button hover:bg-white transition-colors"
                  >
                    <Archive className="w-4 h-4 text-neutral-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-1.5 rounded-button hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HabitsModule;
