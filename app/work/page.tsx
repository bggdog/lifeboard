'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Check, Trash2, Edit2, Save } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getOrCreateProfile } from '@/lib/profile';
import { fetchCategories, createCategory, deleteCategory, type WorkNoteCategory } from '@/lib/work/categories';
import { fetchNotes, createNote, updateNote, deleteNote, type WorkNote } from '@/lib/work/notes';
import { fetchWorkTodos, createWorkTodo, toggleWorkTodoComplete, deleteWorkTodo, type WorkTodo } from '@/lib/work/workTodos';
import { fetchEditItems, createEditItem, setEditItemStatus, deleteEditItem, type EditItem, type EditItemType, type EditItemStatus } from '@/lib/work/editItems';
import { tokenStore } from '@/lib/tokenStore';
import { getTokenBalance } from '@/lib/tokens';

type View = 'notes' | 'todos' | 'edits';

export default function WorkPage() {
  const [activeView, setActiveView] = useState<View>('notes');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes state
  const [categories, setCategories] = useState<WorkNoteCategory[]>([]);
  const [notes, setNotes] = useState<WorkNote[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<WorkNote | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Todos state
  const [todos, setTodos] = useState<WorkTodo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [selectedTokens, setSelectedTokens] = useState(1);
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);

  // Edit items state
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [editFilter, setEditFilter] = useState<EditItemType | 'all'>('all');
  const [newEditTitle, setNewEditTitle] = useState('');
  const [newEditType, setNewEditType] = useState<EditItemType>('short_form');
  const [selectedEditTokens, setSelectedEditTokens] = useState(2);
  const [pendingStatusChanges, setPendingStatusChanges] = useState<Set<string>>(new Set());
  const [deletingEditId, setDeletingEditId] = useState<string | null>(null);

  // Load all data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const profile = await getOrCreateProfile();
        setProfileId(profile.id);

        // Load token balance
        const balance = await getTokenBalance(profile.id);
        tokenStore.setBalance(balance);

        // Load all work data in parallel
        const [categoriesData, notesData, todosData, editsData] = await Promise.all([
          fetchCategories(profile.id),
          fetchNotes(profile.id),
          fetchWorkTodos(profile.id),
          fetchEditItems(profile.id),
        ]);

        setCategories(categoriesData);
        setNotes(notesData);
        setTodos(todosData);
        setEditItems(editsData);
      } catch (err: any) {
        console.error('Error loading work data:', err);
        const errorMessage = err?.message || 'Failed to load work data';
        
        // Check if it's a table not found error
        if (errorMessage.includes('does not exist') || 
            errorMessage.includes('schema cache') ||
            errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          setError('Work tables not found. Please run CREATE_WORK_TABLES.sql in Supabase SQL Editor first.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Notes handlers
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !profileId) return;

    const name = newCategoryName.trim();
    setNewCategoryName('');
    setShowNewCategory(false);

    try {
      const newCategory = await createCategory(profileId, name);
      setCategories((prev) => [...prev, newCategory]);
    } catch (err: any) {
      setError(err?.message || 'Failed to create category');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSaveNote = async (note: Partial<WorkNote>) => {
    if (!profileId) return;

    try {
      if (editingNote?.id) {
        // Update existing
        const updated = await updateNote(editingNote.id, {
          title: note.title,
          body: note.body,
          categoryId: note.category_id,
        });
        setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)));
      } else {
        // Create new
        const newNote = await createNote(profileId, {
          title: note.title || '',
          body: note.body || '',
          categoryId: note.category_id || null,
        });
        setNotes((prev) => [newNote, ...prev]);
      }
      setEditingNote(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to save note');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!profileId) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(id, profileId);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete note');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Todos handlers
  const handleAddTodo = async () => {
    if (!newTodoTitle.trim() || !profileId) return;

    const title = newTodoTitle.trim();
    setNewTodoTitle('');
    setSelectedTokens(1);

    try {
      const newTodo = await createWorkTodo(profileId, title, selectedTokens);
      setTodos((prev) => [newTodo, ...prev]);
    } catch (err: any) {
      setError(err?.message || 'Failed to add todo');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleToggleTodo = async (todo: WorkTodo) => {
    if (pendingToggles.has(todo.id) || !profileId) return;

    const newCompleted = !todo.completed;
    const tokenDelta = newCompleted ? todo.tokens : -todo.tokens;

    setPendingToggles((prev) => new Set(prev).add(todo.id));

    // Optimistic update
    const updatedTodo = {
      ...todo,
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    };
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? updatedTodo : t)));
    tokenStore.applyDelta(tokenDelta);

    try {
      await toggleWorkTodoComplete({
        profileId,
        id: todo.id,
        completed: newCompleted,
        title: todo.title,
        tokens: todo.tokens,
      });

      // Refresh token balance
      try {
        const balance = await getTokenBalance(profileId);
        tokenStore.setBalance(balance);
      } catch (balanceError) {
        console.error('Error refreshing token balance:', balanceError);
      }
    } catch (err: any) {
      // Rollback
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? todo : t)));
      tokenStore.applyDelta(-tokenDelta);
      setError(err?.message || 'Failed to update todo');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
    }
  };

  const handleDeleteTodo = async (todo: WorkTodo) => {
    if (deletingTodoId === todo.id) {
      if (!confirm('Are you sure you want to delete this todo?')) {
        setDeletingTodoId(null);
        return;
      }

      try {
        await deleteWorkTodo(todo.id, profileId!);
        setTodos((prev) => prev.filter((t) => t.id !== todo.id));
      } catch (err: any) {
        setError(err?.message || 'Failed to delete todo');
        setTimeout(() => setError(null), 3000);
      } finally {
        setDeletingTodoId(null);
      }
    } else {
      setDeletingTodoId(todo.id);
    }
  };

  // Edit items handlers
  const handleAddEditItem = async () => {
    if (!newEditTitle.trim() || !profileId) return;

    const title = newEditTitle.trim();
    setNewEditTitle('');
    setSelectedEditTokens(2); // Reset to default

    try {
      const newItem = await createEditItem(profileId, {
        title,
        type: newEditType,
        tokens: selectedEditTokens,
      });
      setEditItems((prev) => [newItem, ...prev]);
    } catch (err: any) {
      setError(err?.message || 'Failed to add edit item');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCycleStatus = async (item: EditItem) => {
    if (pendingStatusChanges.has(item.id) || !profileId) return;

    const statusOrder: EditItemStatus[] = ['queued', 'in_progress', 'done'];
    const currentIndex = statusOrder.indexOf(item.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    setPendingStatusChanges((prev) => new Set(prev).add(item.id));

    // Optimistic update
    const updatedItem = {
      ...item,
      status: nextStatus,
      completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
    };
    setEditItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));

    // Optimistic token update
    const wasDone = item.status === 'done';
    const willBeDone = nextStatus === 'done';
    if (willBeDone && !wasDone) {
      tokenStore.applyDelta(item.tokens);
    } else if (!willBeDone && wasDone) {
      tokenStore.applyDelta(-item.tokens);
    }

    try {
      await setEditItemStatus({
        profileId,
        id: item.id,
        status: nextStatus,
        title: item.title,
        tokens: item.tokens,
        previousStatus: item.status,
      });

      // Refresh token balance
      try {
        const balance = await getTokenBalance(profileId);
        tokenStore.setBalance(balance);
      } catch (balanceError) {
        console.error('Error refreshing token balance:', balanceError);
      }
    } catch (err: any) {
      // Rollback
      setEditItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      if (willBeDone && !wasDone) {
        tokenStore.applyDelta(-item.tokens);
      } else if (!willBeDone && wasDone) {
        tokenStore.applyDelta(item.tokens);
      }
      setError(err?.message || 'Failed to update edit item');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingStatusChanges((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleDeleteEditItem = async (item: EditItem) => {
    if (deletingEditId === item.id) {
      if (!confirm('Are you sure you want to delete this edit item?')) {
        setDeletingEditId(null);
        return;
      }

      try {
        await deleteEditItem(item.id, profileId!);
        setEditItems((prev) => prev.filter((i) => i.id !== item.id));
      } catch (err: any) {
        setError(err?.message || 'Failed to delete edit item');
        setTimeout(() => setError(null), 3000);
      } finally {
        setDeletingEditId(null);
      }
    } else {
      setDeletingEditId(item.id);
    }
  };

  const filteredEditItems = editFilter === 'all' 
    ? editItems 
    : editItems.filter((item) => item.type === editFilter);

  const filteredNotes = selectedCategoryId
    ? notes.filter((note) => note.category_id === selectedCategoryId)
    : notes;

  const tokenOptions = [1, 2, 3, 5];
  const editTypes: { value: EditItemType; label: string }[] = [
    { value: 'short_form', label: 'Short' },
    { value: 'long_form', label: 'Long' },
    { value: 'full_episode', label: 'Episode' },
  ];

  return (
    <AppShell>
      <div className="p-6 space-y-4 pb-24">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Work</h1>
          <p className="text-sm text-neutral-500">Notes, tasks, and edits</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Segmented Control */}
        <div className="bg-white rounded-2xl shadow-sm p-2 mb-4">
          <div className="flex gap-2">
            {(['notes', 'todos', 'edits'] as View[]).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                  activeView === view
                    ? 'bg-accent text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {view === 'notes' ? 'Notes' : view === 'todos' ? 'To-Dos' : 'Edit List'}
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

        {/* Notes View */}
        {!loading && activeView === 'notes' && (
          <div className="space-y-4">
            {/* Categories */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategoryId === null
                      ? 'bg-accent text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategoryId === cat.id
                        ? 'bg-accent text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
                {showNewCategory ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateCategory();
                        if (e.key === 'Escape') {
                          setShowNewCategory(false);
                          setNewCategoryName('');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-neutral-50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      autoFocus
                    />
                    <button
                      onClick={handleCreateCategory}
                      className="p-2 bg-accent text-white rounded-xl"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCategory(false);
                        setNewCategoryName('');
                      }}
                      className="p-2 bg-neutral-100 text-neutral-600 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewCategory(true)}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-neutral-100 text-neutral-600 whitespace-nowrap"
                  >
                    + Category
                  </button>
                )}
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              <button
                onClick={() => setEditingNote({} as WorkNote)}
                className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-center gap-2 text-accent font-medium hover:bg-neutral-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Note
              </button>

              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        {note.title}
                      </h3>
                      {note.category_id && (
                        <span className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-medium mb-2">
                          {categories.find((c) => c.id === note.category_id)?.name}
                        </span>
                      )}
                      <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                        {note.body}
                      </p>
                      <p className="text-xs text-neutral-400 mt-2">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-2 text-neutral-400 hover:text-accent rounded-lg hover:bg-neutral-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredNotes.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                  <p className="text-neutral-500">No notes yet.</p>
                </div>
              )}
            </div>

            {/* Note Editor Modal */}
            {editingNote !== null && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-900">
                      {editingNote.id ? 'Edit Note' : 'New Note'}
                    </h2>
                    <button
                      onClick={() => setEditingNote(null)}
                      className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Title"
                      value={editingNote.title || ''}
                      onChange={(e) =>
                        setEditingNote({ ...editingNote, title: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                    />

                    <textarea
                      placeholder="Body"
                      value={editingNote.body || ''}
                      onChange={(e) =>
                        setEditingNote({ ...editingNote, body: e.target.value })
                      }
                      rows={8}
                      className="w-full px-4 py-3 bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />

                    <select
                      value={editingNote.category_id || ''}
                      onChange={(e) =>
                        setEditingNote({
                          ...editingNote,
                          category_id: e.target.value || null,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">No Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveNote(editingNote)}
                        className="flex-1 px-4 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="px-4 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* To-Dos View */}
        {!loading && activeView === 'todos' && (
          <div className="space-y-4">
            {/* Add Todo */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add a work task…"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTodo();
                  }}
                  className="flex-1 px-4 py-3 bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  onClick={handleAddTodo}
                  className="px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

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

            {/* Todos List */}
            <div className="space-y-3">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
                >
                  <button
                    onClick={() => handleToggleTodo(todo)}
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
                    {todo.completed && <Check className="w-4 h-4 text-white" />}
                  </button>

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

                  {todo.tokens > 0 && (
                    <div className="flex-shrink-0 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium">
                      +{todo.tokens}
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteTodo(todo)}
                    className="flex-shrink-0 p-2 text-neutral-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    {deletingTodoId === todo.id ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}

              {todos.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                  <p className="text-neutral-500">No work todos yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit List View */}
        {!loading && activeView === 'edits' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(['all', 'short_form', 'long_form', 'full_episode'] as const).map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setEditFilter(filter)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                        editFilter === filter
                          ? 'bg-accent text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {filter === 'all'
                        ? 'All'
                        : filter === 'short_form'
                        ? 'Short'
                        : filter === 'long_form'
                        ? 'Long'
                        : 'Episode'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Add Edit Item */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Edit title…"
                    value={newEditTitle}
                    onChange={(e) => setNewEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddEditItem();
                    }}
                    className="flex-1 min-w-0 px-4 py-3 bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <select
                    value={newEditType}
                    onChange={(e) => setNewEditType(e.target.value as EditItemType)}
                    className="px-3 sm:px-4 py-3 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent flex-shrink-0"
                  >
                    {editTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 items-center">
                  {tokenOptions.map((tokens) => (
                    <button
                      key={tokens}
                      onClick={() => setSelectedEditTokens(tokens)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedEditTokens === tokens
                          ? 'bg-accent text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      +{tokens}
                    </button>
                  ))}
                  <button
                    onClick={handleAddEditItem}
                    className="ml-auto px-4 py-2 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

            </div>

            {/* Edit Items List */}
            <div className="space-y-3">
              {filteredEditItems.map((item) => {
                const isDone = item.status === 'done';
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl shadow-sm p-4 transition-all ${
                      isDone ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 min-w-0">
                          <h3
                            className={`font-semibold truncate ${
                              isDone
                                ? 'line-through text-neutral-400'
                                : 'text-neutral-900'
                            }`}
                          >
                            {item.title}
                          </h3>
                          {isDone && (
                            <Check className="w-4 h-4 text-accent flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0">
                            {item.type === 'short_form'
                              ? 'Short'
                              : item.type === 'long_form'
                              ? 'Long'
                              : 'Episode'}
                          </span>
                          <button
                            onClick={() => handleCycleStatus(item)}
                            disabled={pendingStatusChanges.has(item.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                              pendingStatusChanges.has(item.id)
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            } ${
                              item.status === 'done'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {item.status === 'done'
                              ? 'Done'
                              : item.status === 'in_progress'
                              ? 'In Progress'
                              : 'Queued'}
                          </button>
                          {item.tokens > 0 && (
                            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0">
                              +{item.tokens}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEditItem(item)}
                        className="flex-shrink-0 p-2 text-neutral-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      >
                        {deletingEditId === item.id ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredEditItems.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                  <p className="text-neutral-500">No edit items yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
