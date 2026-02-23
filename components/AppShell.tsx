'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, CheckSquare, Target, Briefcase, Dumbbell, Trophy, User, FileCheck, Menu, Search, Coins } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { tokenStore } from '@/lib/tokenStore';
import { getTokenBalance } from '@/lib/tokens';
import { getOrCreateProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser, signOut } from '@/lib/auth';
import AuthModal from './AuthModal';

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/todo', icon: CheckSquare, label: 'To Do' },
  { path: '/habits', icon: Target, label: 'Habits' },
  { path: '/work', icon: Briefcase, label: 'Work' },
  { path: '/gym', icon: Dumbbell, label: 'Gym' },
  { path: '/game', icon: Trophy, label: 'Game' },
  { path: '/review', icon: FileCheck, label: 'Review' },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [tokenBalance, setTokenBalance] = useState<number>(tokenStore.getBalance());
  const [level, setLevel] = useState<number>(1);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = async (authUser: { id: string; email?: string }) => {
    setUser(authUser);
    // Reload the page to refresh data with new profile
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    // Reload to reset to anonymous profile
    window.location.reload();
  };

  return (
    <div className={`h-screen h-[100dvh] bg-neutral-50 overflow-hidden ${isDesktop ? 'flex flex-row' : 'flex flex-col'}`}>
      {/* ========== DESKTOP: Left Sidebar ========== */}
      {isDesktop && (
      <aside
        className={`flex flex-col flex-shrink-0 bg-white border-r border-neutral-200 transition-[width] duration-200 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
          {sidebarOpen ? (
            <h1 className="text-xl font-semibold text-accent">LifeOS</h1>
          ) : (
            <span className="text-lg font-bold text-accent">L</span>
          )}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 flex-1 overflow-y-auto">
          {sidebarOpen ? (
            <div className="mb-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {user?.email ? user.email.split('@')[0] : 'Guest'}
                  </p>
                  <p className="text-xs text-neutral-500">Lv {level}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="w-5 h-5 text-accent" />
              </div>
            </div>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isActive
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
      )}

      {/* ========== Top Header + Main ========== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Mobile: narrow | Desktop: full width with search */}
        <header className="bg-white border-b border-neutral-200 safe-area-top flex-shrink-0 sticky top-0 z-40">
          <div className={`${isDesktop ? 'max-w-none' : 'max-w-[420px]'} mx-auto px-4 py-3 flex items-center justify-between gap-4 w-full`}>
            <div className="flex items-center gap-3 min-w-0">
              {!isDesktop && <h1 className="text-xl font-semibold text-neutral-900">LifeOS</h1>}
              {isDesktop && (
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="search"
                      placeholder="Search tasks, habits..."
                      className="w-full pl-9 pr-4 py-2 bg-neutral-100 rounded-xl border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                      readOnly
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 rounded-full">
                <span className="text-xs font-medium text-neutral-600">Lv</span>
                <span className="text-sm font-semibold text-neutral-900">{level}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-semibold text-neutral-900">{tokenBalance}</span>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors touch-target rounded-lg hover:bg-neutral-100"
                title={user?.email || 'Sign in to sync across devices'}
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable; desktop uses full width */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-container">
          <div className={`${isDesktop ? 'max-w-7xl px-6 py-6' : 'max-w-[420px]'} mx-auto min-h-full bg-neutral-50 w-full`}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </div>
        </main>

        {/* Bottom Tab Bar - Mobile only */}
        {!isDesktop && (
        <nav className="bg-white border-t border-neutral-200 safe-area-bottom flex-shrink-0 sticky bottom-0 z-50">
          <div className="max-w-[420px] mx-auto">
            <div className="flex items-center justify-around py-2">
              {navItems.filter((t) => t.path !== '/review').map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname === tab.path;
                const label = tab.path === '/' ? 'Today' : tab.label;
                return (
                  <button
                    key={tab.path}
                    onClick={() => router.push(tab.path)}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-button transition-colors touch-target ${
                      isActive ? 'text-accent' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
