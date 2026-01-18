import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardModule, DashboardModuleType } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

const MODULE_OPTIONS: { type: DashboardModuleType; label: string; description: string }[] = [
  { type: 'token-balance', label: 'Token Balance', description: 'Show your current token balance' },
  { type: 'habits', label: 'Habits', description: 'View and complete your habits' },
  { type: 'todos', label: 'To-Dos', description: 'Manage your to-do list' },
  { type: 'journal', label: 'Journal', description: 'Quick journal entry' },
  { type: 'rewards-shortcut', label: 'Rewards Shortcut', description: 'Quick access to rewards' },
  { type: 'habit-categories', label: 'Habit Categories', description: 'View habits by category' },
  { type: 'focus-card', label: 'Focus Card', description: 'Pin a priority habit or goal' },
  { type: 'notes-feed', label: 'Notes Feed', description: 'Recent journal entries' },
];

interface DashboardSettingsProps {
  onClose: () => void;
}

const DashboardSettings = ({ onClose }: DashboardSettingsProps) => {
  const { state, updateDashboardModules } = useApp();
  const [showAddModule, setShowAddModule] = useState(false);

  const handleRemoveModule = async (moduleId: string) => {
    try {
      const updated = state.dashboardModules.filter(m => m.id !== moduleId);
      const reordered = updated.map((m, index) => ({ ...m, position: index }));
      await updateDashboardModules(reordered);
    } catch (error: any) {
      console.error('Error removing module:', error);
      alert(`Failed to remove module: ${error?.message || 'Unknown error'}\n\nMake sure the backend server is running on port 3001.`);
    }
  };

  const handleAddModule = async (type: DashboardModuleType) => {
    try {
      const newModule: DashboardModule = {
        id: `module-${Date.now()}`,
        type,
        position: state.dashboardModules.length,
      };
      await updateDashboardModules([...state.dashboardModules, newModule]);
      setShowAddModule(false);
    } catch (error: any) {
      console.error('Error adding module:', error);
      alert(`Failed to add module: ${error?.message || 'Unknown error'}\n\nMake sure the backend server is running on port 3001.`);
    }
  };

  const availableModules = MODULE_OPTIONS.filter(
    opt => !state.dashboardModules.some(m => m.type === opt.type)
  );

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Dashboard Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-button hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">Current Modules</h3>
              {availableModules.length > 0 && (
                <button
                  onClick={() => setShowAddModule(!showAddModule)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </button>
              )}
            </div>

            {showAddModule && (
              <div className="mb-4 p-4 bg-neutral-50 rounded-card space-y-2">
                {availableModules.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleAddModule(option.type)}
                    className="w-full text-left p-3 rounded-button hover:bg-white border border-neutral-200 transition-colors"
                  >
                    <div className="font-medium text-neutral-900">{option.label}</div>
                    <div className="text-sm text-neutral-600">{option.description}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {state.dashboardModules
                .sort((a, b) => a.position - b.position)
                .map((module) => {
                  const option = MODULE_OPTIONS.find(o => o.type === module.type);
                  return (
                    <div
                      key={module.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-button"
                    >
                      <div>
                        <div className="font-medium text-neutral-900">{option?.label}</div>
                        <div className="text-sm text-neutral-600">{option?.description}</div>
                      </div>
                      {state.dashboardModules.length > 1 && (
                        <button
                          onClick={() => handleRemoveModule(module.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-button transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4">
          <button onClick={onClose} className="btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;
