'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, CheckSquare, Target, Briefcase, Dumbbell } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/todo', icon: CheckSquare, label: 'To Do' },
    { path: '/habits', icon: Target, label: 'Habits' },
    { path: '/work', icon: Briefcase, label: 'Work' },
    { path: '/gym', icon: Dumbbell, label: 'Gym' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-neutral-200 safe-area-top">
        <div className="max-w-[420px] mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">LifeOS</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-700">0</span>
            <span className="text-lg">💰</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[420px] mx-auto min-h-full bg-neutral-50">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar */}
      <nav className="bg-white border-t border-neutral-200 safe-area-bottom">
        <div className="max-w-[420px] mx-auto">
          <div className="flex items-center justify-around py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.path;
              
              return (
                <button
                  key={tab.path}
                  onClick={() => router.push(tab.path)}
                  className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-button transition-colors ${
                    isActive
                      ? 'text-accent'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
