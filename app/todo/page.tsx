'use client';

import { useState, useEffect } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getOrCreateProfile } from '@/lib/profile';
import {
  fetchTodos,
  createTodo,
  toggleTodoComplete,
  deleteTodo,
  type Todo,
} from '@/lib/todos';
import { tokenStore } from '@/lib/tokenStore';
import { getTokenBalance } from '@/lib/tokens';

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [selectedTokens, setSelectedTokens] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [profileId, setProfileId] = useState<string | null>(null);

  // Load todos and token balance on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const profile = await getOrCreateProfile();
        setProfileId(profile.id);

        // Load todos and token balance in parallel
        const [todosData, balance] = await Promise.all([
          fetchTodos(profile.id),
          getTokenBalance(profile.id),
        ]);

        setTodos(todosData);
        tokenStore.setBalance(balance);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle adding a new todo
  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return;

    const title = newTodoTitle.trim();
    setNewTodoTitle('');

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticTodo: Todo = {
      id: tempId,
      profile_id: '',
      title,
      completed: false,
      tokens: selectedTokens,
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    setTodos((prev) => [optimisticTodo, ...prev]);

    try {
      const profile = await getOrCreateProfile();
      const newTodo = await createTodo(profile.id, title, selectedTokens);

      // Replace optimistic todo with real one
      setTodos((prev) =>
        prev.map((t) => (t.id === tempId ? newTodo : t))
      );
      setSelectedTokens(1);
    } catch (err: any) {
      // Rollback on error
      setTodos((prev) => prev.filter((t) => t.id !== tempId));
      setError(err?.message || 'Failed to add todo');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle toggling completion with token integration
  const handleToggleComplete = async (todo: Todo) => {
    // Prevent double-taps
    if (pendingToggles.has(todo.id) || !profileId) return;

    const newCompleted = !todo.completed;
    const tokenDelta = newCompleted ? todo.tokens : -todo.tokens;

    // Mark as pending
    setPendingToggles((prev) => new Set(prev).add(todo.id));

    // Optimistic updates: todo state + token balance
    const updatedTodo = {
      ...todo,
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    };
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? updatedTodo : t))
    );
    tokenStore.applyDelta(tokenDelta);

    try {
      const result = await toggleTodoComplete(todo.id, newCompleted, {
        profileId,
        tokens: todo.tokens,
        title: todo.title,
      });

      // Update token balance from server response if available
      if (result.newBalance !== undefined) {
        tokenStore.setBalance(result.newBalance);
      }
    } catch (err: any) {
      // Rollback on error: both todo state and token balance
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? todo : t))
      );
      tokenStore.applyDelta(-tokenDelta); // Reverse the delta
      setError(err?.message || 'Failed to update todo');
      setTimeout(() => setError(null), 3000);
    } finally {
      // Remove pending flag
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
    }
  };

  // Handle deletion
  const handleDelete = async (todo: Todo) => {
    if (deletingId === todo.id) {
      // Confirm deletion
      if (!confirm('Are you sure you want to delete this task?')) {
        setDeletingId(null);
        return;
      }

      // Optimistic update
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));

      try {
        await deleteTodo(todo.id);
      } catch (err: any) {
        // Rollback on error
        setTodos((prev) => [...prev, todo].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        setError(err?.message || 'Failed to delete todo');
        setTimeout(() => setError(null), 3000);
      } finally {
        setDeletingId(null);
      }
    } else {
      setDeletingId(todo.id);
    }
  };

  const tokenOptions = [1, 2, 3, 5];

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">To Do</h1>
          <p className="text-sm text-neutral-500">Tap to complete</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Add Todo Input */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Add a task…"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTodo();
                }
              }}
              className="flex-1 px-4 py-3 bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleAddTodo}
              className="px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Token Selector */}
          <div className="flex gap-2">
            {tokenOptions.map((tokens) => (
              <button
                key={tokens}
                onClick={() => setSelectedTokens(tokens)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedTokens === tokens
                    ? 'bg-accent text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                +{tokens}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
              >
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Todo List */}
        {!loading && todos.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-neutral-500">No tasks yet. Add one to get started!</p>
          </div>
        )}

        {!loading && todos.length > 0 && (
          <div className="space-y-3 pb-4">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(todo)}
                  disabled={pendingToggles.has(todo.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    pendingToggles.has(todo.id)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  } ${
                    todo.completed
                      ? 'bg-accent border-accent'
                      : 'border-neutral-300 hover:border-accent'
                  }`}
                >
                  {todo.completed && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-base font-medium ${
                      todo.completed
                        ? 'line-through text-neutral-400'
                        : 'text-neutral-900'
                    }`}
                  >
                    {todo.title}
                  </p>
                </div>

                {/* Token Badge */}
                {todo.tokens > 0 && (
                  <div className="flex-shrink-0 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium">
                    +{todo.tokens}
                  </div>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(todo)}
                  className="flex-shrink-0 p-2 text-neutral-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                >
                  {deletingId === todo.id ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
