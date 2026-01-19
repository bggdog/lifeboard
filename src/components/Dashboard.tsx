import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Briefcase, Dumbbell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TokenBalanceModule from './modules/TokenBalanceModule';
import HabitsModule from './modules/HabitsModule';
import TodosModule from './modules/TodosModule';
import JournalModule from './modules/JournalModule';
import RewardsShortcutModule from './modules/RewardsShortcutModule';
import DashboardSettings from './DashboardSettings';

const Dashboard = () => {
  const { state, refreshState } = useApp();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkApi = async () => {
      try {
        await fetch('/api/health');
        setApiError(null);
      } catch (err) {
        setApiError('Cannot connect to backend server. Make sure it\'s running on port 3001.');
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 5000);
    return () => clearInterval(interval);
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-neutral-600 animate-pulse-subtle">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const sortedModules = [...state.dashboardModules].sort((a, b) => a.position - b.position);

  const renderModule = (module: any) => {
    switch (module.type) {
      case 'token-balance':
        return <TokenBalanceModule />;
      case 'habits':
        return <HabitsModule />;
      case 'todos':
        return <TodosModule />;
      case 'journal':
        return <JournalModule />;
      case 'rewards-shortcut':
        return <RewardsShortcutModule />;
      default:
        return <div className="p-4 text-neutral-500">Module type: {module.type}</div>;
    }
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">Lifeboard</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/work')}
                className="p-2 rounded-button hover:bg-neutral-100 transition-all duration-200 hover:scale-105 flex items-center gap-2"
                title="Work Notes"
              >
                <Briefcase className="w-5 h-5 text-neutral-600 transition-transform duration-200 hover:rotate-12" />
                <span className="text-sm text-neutral-600 hidden sm:inline">Work Notes</span>
              </button>
              <button
                onClick={() => navigate('/gym')}
                className="p-2 rounded-button hover:bg-neutral-100 transition-all duration-200 hover:scale-105 flex items-center gap-2"
                title="Gym Notes"
              >
                <Dumbbell className="w-5 h-5 text-neutral-600 transition-transform duration-200 hover:rotate-12" />
                <span className="text-sm text-neutral-600 hidden sm:inline">Gym Notes</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-button hover:bg-neutral-100 transition-all duration-200 hover:rotate-90"
                aria-label="Dashboard settings"
              >
                <SettingsIcon className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-card text-red-800">
            <p className="font-medium">⚠️ Connection Error</p>
            <p className="text-sm mt-1">{apiError}</p>
            <button
              onClick={() => {
                setApiError(null);
                refreshState();
              }}
              className="mt-3 btn-primary text-sm"
            >
              Retry Connection
            </button>
          </div>
        )}

        <div className="space-y-6">
          {sortedModules.map((module, index) => (
            <div 
              key={module.id} 
              className="card p-6 animate-fade-in-up"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                opacity: 0
              }}
            >
              {renderModule(module)}
            </div>
          ))}
        </div>
      </main>

      {showSettings && (
        <DashboardSettings
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
