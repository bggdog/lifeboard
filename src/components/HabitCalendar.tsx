import { useApp } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, subDays, addDays } from 'date-fns';
import { Habit } from '../types';

interface HabitCalendarProps {
  habit: Habit;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const HabitCalendar = ({ habit, selectedDate, onDateSelect }: HabitCalendarProps) => {
  const { state } = useApp();
  const today = new Date();
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get completion dates for this habit
  const completions = state.habitCompletions
    .filter(hc => hc.habitId === habit.id)
    .map(hc => parseISO(hc.date));

  const isCompleted = (date: Date) => {
    return completions.some(completionDate => isSameDay(completionDate, date));
  };

  const isToday = (date: Date) => isSameDay(date, today);
  const isSelected = (date: Date) => isSameDay(date, selectedDate);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subDays(monthStart, 1)
      : addDays(monthEnd, 1);
    onDateSelect(newDate);
  };

  return (
    <div className="bg-white rounded-card p-4 border border-neutral-200">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 rounded-button hover:bg-neutral-100 transition-colors"
        >
          ←
        </button>
        <h4 className="font-semibold text-neutral-900">
          {format(selectedDate, 'MMMM yyyy')}
        </h4>
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 rounded-button hover:bg-neutral-100 transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-neutral-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month start */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {daysInMonth.map((date) => {
          const completed = isCompleted(date);
          const today = isToday(date);
          const selected = isSelected(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`aspect-square rounded-md text-xs transition-all duration-200 ${
                completed
                  ? 'bg-accent text-white font-semibold'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
              } ${
                today ? 'ring-2 ring-accent/50' : ''
              } ${
                selected ? 'ring-2 ring-accent' : ''
              }`}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-accent"></div>
            <span className="text-neutral-600">Completed</span>
          </div>
          <div className="text-neutral-500">
            {completions.length} days this month
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitCalendar;
