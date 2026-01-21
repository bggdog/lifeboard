'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, CheckSquare, Target, Briefcase, Dumbbell, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { tokenStore } from '@/lib/tokenStore';
import { getTokenBalance } from '@/lib/tokens';
import { getOrCreateProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase/client';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  // Initialize with current tokenStore balance (if available)
  const [tokenBalance, setTokenBalance] = useState<number>(tokenStore.getBalance());
  const [level, setLevel] = useState<number>(1);

  // Subscribe to token store and load balance on mount and navigation
  useEffect(() => {
    // Subscribe to token balance changes
    const unsubscribe = tokenStore.subscribe((balance) => {
      setTokenBalance(balance);
    });

    // Load balance and level from database
    async function loadBalance() {
      try {
        const profile = await getOrCreateProfile();
        const balance = await getTokenBalance(profile.id);
        tokenStore.setBalance(balance);

        // Load level
        const { data: profileData } = await supabase
          .from('profiles')
          .select('level')
          .eq('id', profile.id)
          .single();

        if (profileData?.level) {
          setLevel(profileData.level);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    }

    // Load balance on mount and when pathname changes
    loadBalance();

    return unsubscribe;
  }, [pathname]); // Reload when navigating between pages

  const tabs = [
    { path: '/', icon: Home, label: 'Today' },
    { path: '/todo', icon: CheckSquare, label: 'To Do' },
    { path: '/habits', icon: Target, label: 'Habits' },
    { path: '/work', icon: Briefcase, label: 'Work' },
    { path: '/gym', icon: Dumbbell, label: 'Gym' },
    { path: '/game', icon: Trophy, label: 'Game' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-neutral-200 safe-area-top">
        <div className="max-w-[420px] mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">LifeOS</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 rounded-full">
              <span className="text-xs font-medium text-neutral-600">Lv</span>
              <span className="text-sm font-semibold text-neutral-900">{level}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full">
              <span className="text-lg">🪙</span>
              <span className="text-sm font-semibold text-neutral-900">
                {tokenBalance}
              </span>
            </div>
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
