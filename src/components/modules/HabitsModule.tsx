import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, X, Calendar } from 'lucide-react';
import { Habit } from '../../types';
import HabitForm from '../HabitForm';
import HabitCalendar from '../HabitCalendar';
import ConfettiEffect from '../ConfettiEffect';

const HabitsModule = () => {
  const { state, isHabitCompleted, addHabit, updateHabit, deleteHabit, completeHabit } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatingHabitId, setAnimatingHabitId] = useState<string | null>(null);
  const [selectedHabitForCalendar, setSelectedHabitForCalendar] = useState<Habit | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const today = format(new Date(), 'yyyy-MM-dd');
  const activeHabits = state.habits.filter(h => !h.archived);

  const handleComplete = async (habitId: string) => {
    const wasCompleted = isHabitCompleted(habitId, today);
    await completeHabit(habitId, today);
    
    // Show celebration if completing (not uncompleting)
    if (!wasCompleted) {
      setAnimatingHabitId(habitId);
      setShowConfetti(true);
      setTimeout(() => setAnimatingHabitId(null), 300);
    }
  };

  const handleDelete = async (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      await deleteHabit(habitId);
      if (selectedHabitForCalendar?.id === habitId) {
        setSelectedHabitForCalendar(null);
      }
    }
  };

  return (
    <div>
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Habits</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-2 rounded-button hover:bg-neutral-100 transition-all duration-200 hover:rotate-90"
        >
          <Plus className="w-5 h-5 text-neutral-600 transition-transform" />
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-neutral-50 rounded-card animate-slide-in">
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
        <div className="mb-6 p-4 bg-neutral-50 rounded-card animate-slide-in">
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

      {activeHabits.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <p>No habits yet. Add your first habit to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habits Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {activeHabits.map((habit) => {
                const completed = isHabitCompleted(habit.id, today);
                return (
                  <div
                    key={habit.id}
                    className={`relative group aspect-square rounded-card p-4 transition-all duration-200 animate-fade-in ${
                      completed
                        ? 'bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/30'
                        : 'bg-white border border-neutral-200 hover:border-accent/50 hover:shadow-card'
                    }`}
                  >
                    {/* Emoji Display */}
                    <div className="flex flex-col items-center justify-center h-full">
                      <button
                        onClick={() => handleComplete(habit.id)}
                        className={`text-5xl mb-2 transition-all duration-200 ${
                          animatingHabitId === habit.id ? 'animate-bounce-subtle scale-125' : ''
                        } ${completed ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                      >
                        {habit.emoji || '⭐'}
                      </button>
                      
                      <div className="text-center">
                        <div className="font-semibold text-neutral-900 text-sm mb-1">
                          {habit.name}
                        </div>
                        <div className="text-xs text-neutral-500">
                          +{habit.tokenReward} <span className="text-yellow-600">💰</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Show on Hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                      <button
                        onClick={() => setEditingHabit(habit)}
                        className="p-1.5 rounded-button bg-white/90 hover:bg-white transition-colors shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(habit.id)}
                        className="p-1.5 rounded-button bg-white/90 hover:bg-red-50 transition-colors shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>

                    {/* Calendar Button */}
                    <button
                      onClick={() => {
                        setSelectedHabitForCalendar(habit);
                        setCalendarDate(new Date());
                      }}
                      className="absolute bottom-2 right-2 p-1.5 rounded-button bg-white/90 hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                    </button>

                    {/* Completion Indicator */}
                    {completed && (
                      <div className="absolute top-2 left-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendar Sidebar */}
          <div className="lg:col-span-1">
            {selectedHabitForCalendar ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <span className="text-2xl">{selectedHabitForCalendar.emoji || '⭐'}</span>
                    <span>{selectedHabitForCalendar.name}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedHabitForCalendar(null)}
                    className="p-1 rounded-button hover:bg-neutral-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-neutral-600" />
                  </button>
                </div>
                <HabitCalendar
                  habit={selectedHabitForCalendar}
                  selectedDate={calendarDate}
                  onDateSelect={setCalendarDate}
                />
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-card p-8 text-center border border-neutral-200">
                <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">
                  Click the calendar icon on a habit to view its tracking calendar
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsModule;
