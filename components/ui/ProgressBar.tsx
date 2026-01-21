// Progress bar component
interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
  showLabel?: boolean;
}

export default function ProgressBar({ 
  current, 
  total, 
  className = '',
  showLabel = true 
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
          <span>{current} / {total}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-accent h-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
