// Pill component for badges
interface PillProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Pill({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '' 
}: PillProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-lg';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  
  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-600',
    accent: 'bg-accent text-white',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-50 text-yellow-700',
    neutral: 'bg-neutral-50 text-neutral-600',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
