'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Check, Trash2, Edit2, Save, Briefcase } from 'lucide-react';
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

  const activeTodos = todos.filter((t) => !t.completed);
  const editStats = {
    queued: editItems.filter((i) => i.status === 'queued').length,
    inProgress: editItems.filter((i) => i.status === 'in_progress').length,
    done: editItems.filter((i) => i.status === 'done').length,
  };
  const recentNotes = notes.slice(0, 5);
  const recentEdits = editItems.filter((i) => i.status !== 'done').slice(0, 5);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 space-y-4 pb-24 lg:pb-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* ========== DESKTOP: Breadcrumb + Actions ========== */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <span className="text-neutral-900 font-medium">Work</span>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveView('todos');
                setNewTodoTitle('');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-accent text-accent font-medium hover:bg-accent/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add task
            </button>
            <button
              onClick={() => setEditingNote({} as WorkNote)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              New note
            </button>
          </div>
        </div>

        {/* ========== DESKTOP: Two-column layout ========== */}
        {!loading && (
          <div className="hidden lg:grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Left column */}
            <div className="space-y-6 min-w-0">
              {/* Overview card */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-neutral-200/80">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-7 h-7 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-neutral-900">Work</h2>
                    <p className="text-sm text-neutral-500">Notes, tasks, and edits</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-neutral-200">
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{activeTodos.length}</p>
                    <p className="text-xs text-neutral-500">Active tasks</p>
                  </div>
                  <div className="w-px h-8 bg-neutral-200" />
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{notes.length}</p>
                    <p className="text-xs text-neutral-500">Notes</p>
                  </div>
                  <div className="w-px h-8 bg-neutral-200" />
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{editStats.inProgress + editStats.queued}</p>
                    <p className="text-xs text-neutral-500">Edits in pipeline</p>
                  </div>
                </div>
              </div>

              {/* Tabbed main content */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 overflow-hidden">
                <div className="border-b border-neutral-200 px-6">
                  <div className="flex gap-1">
                    {(['notes', 'todos', 'edits'] as View[]).map((view) => (
                      <button
                        key={view}
                        onClick={() => setActiveView(view)}
                        className={`px-4 py-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                          activeView === view
                            ? 'border-accent text-accent'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        {view === 'notes' ? 'Notes' : view === 'todos' ? 'To-Dos' : 'Edit List'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-6 min-h-[320px] overflow-y-auto max-h-[50vh]">
                  {activeView === 'notes' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedCategoryId(null)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectedCategoryId === null ? 'bg-accent text-white' : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >All</button>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              selectedCategoryId === cat.id ? 'bg-accent text-white' : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >{cat.name}</button>
                        ))}
                        {showNewCategory ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Category"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCategory(); if (e.key === 'Escape') { setShowNewCategory(false); setNewCategoryName(''); } }}
                              className="px-2 py-1 rounded-lg bg-neutral-50 border-0 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-accent"
                              autoFocus
                            />
                            <button onClick={handleCreateCategory} className="p-1.5 bg-accent text-white rounded-lg"><Check className="w-3 h-3" /></button>
                            <button onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }} className="p-1.5 bg-neutral-100 rounded-lg"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setShowNewCategory(true)} className="px-3 py-1.5 rounded-lg text-sm bg-neutral-100 text-neutral-600">+ Category</button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {filteredNotes.map((note) => (
                          <div key={note.id} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100">
                            <button onClick={() => setEditingNote(note)} className="flex-1 text-left min-w-0">
                              <h3 className="font-medium text-neutral-900 truncate">{note.title || 'Untitled'}</h3>
                              <p className="text-xs text-neutral-500 truncate mt-0.5">{note.body ? (note.body.length > 60 ? `${note.body.slice(0, 60)}…` : note.body) : 'No content'}</p>
                            </button>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => setEditingNote(note)} className="p-1.5 text-neutral-400 hover:text-accent rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteNote(note.id)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                        {filteredNotes.length === 0 && <p className="text-sm text-neutral-400 py-4">No notes in this category.</p>}
                      </div>
                    </div>
                  )}
                  {activeView === 'todos' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a work task…"
                          value={newTodoTitle}
                          onChange={(e) => setNewTodoTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddTodo(); }}
                          className="flex-1 px-3 py-2 bg-neutral-50 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <div className="flex gap-1">
                          {tokenOptions.map((t) => (
                            <button key={t} onClick={() => setSelectedTokens(t)} className={`px-2 py-1 rounded-lg text-xs font-medium ${selectedTokens === t ? 'bg-accent text-white' : 'bg-neutral-100 text-neutral-600'}`}>+{t}</button>
                          ))}
                        </div>
                        <button onClick={handleAddTodo} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium">Add</button>
                      </div>
                      <div className="space-y-2">
                        {todos.map((todo) => (
                          <div key={todo.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                            <button onClick={() => handleToggleTodo(todo)} disabled={pendingToggles.has(todo.id)} className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${todo.completed ? 'bg-accent border-accent' : 'border-neutral-300'}`}>
                              {todo.completed && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <p className={`flex-1 text-sm min-w-0 truncate ${todo.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>{todo.title}</p>
                            {todo.tokens > 0 && <span className="text-xs font-medium text-yellow-700 flex-shrink-0">+{todo.tokens}</span>}
                            <button onClick={() => handleDeleteTodo(todo)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded">{deletingTodoId === todo.id ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}</button>
                          </div>
                        ))}
                        {todos.length === 0 && <p className="text-sm text-neutral-400 py-4">No work todos yet.</p>}
                      </div>
                    </div>
                  )}
                  {activeView === 'edits' && (
                    <div className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        {(['all', 'short_form', 'long_form', 'full_episode'] as const).map((f) => (
                          <button key={f} onClick={() => setEditFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${editFilter === f ? 'bg-accent text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                            {f === 'all' ? 'All' : f === 'short_form' ? 'Short' : f === 'long_form' ? 'Long' : 'Episode'}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 flex-wrap items-center">
                        <input
                          type="text"
                          placeholder="Edit title…"
                          value={newEditTitle}
                          onChange={(e) => setNewEditTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddEditItem(); }}
                          className="flex-1 min-w-[120px] px-3 py-2 bg-neutral-50 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <select value={newEditType} onChange={(e) => setNewEditType(e.target.value as EditItemType)} className="px-3 py-2 bg-neutral-50 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent">
                          {editTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <div className="flex gap-1">
                          {tokenOptions.map((t) => (
                            <button key={t} onClick={() => setSelectedEditTokens(t)} className={`px-2 py-1 rounded-lg text-xs font-medium ${selectedEditTokens === t ? 'bg-accent text-white' : 'bg-neutral-100 text-neutral-600'}`}>+{t}</button>
                          ))}
                        </div>
                        <button onClick={handleAddEditItem} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium">Add</button>
                      </div>
                      <div className="space-y-2">
                        {filteredEditItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${item.status === 'done' ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>{item.title}</p>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                <span className="px-2 py-0.5 bg-neutral-200 rounded text-xs">{item.type === 'short_form' ? 'Short' : item.type === 'long_form' ? 'Long' : 'Episode'}</span>
                                <button onClick={() => handleCycleStatus(item)} disabled={pendingStatusChanges.has(item.id)} className={`px-2 py-0.5 rounded text-xs font-medium ${item.status === 'done' ? 'bg-green-100 text-green-700' : item.status === 'in_progress' ? 'bg-accent/10 text-accent' : 'bg-neutral-200 text-neutral-600'}`}>
                                  {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In progress' : 'Queued'}
                                </button>
                                {item.tokens > 0 && <span className="text-xs text-yellow-700">+{item.tokens}</span>}
                              </div>
                            </div>
                            <button onClick={() => handleDeleteEditItem(item)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded flex-shrink-0">{deletingEditId === item.id ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}</button>
                          </div>
                        ))}
                        {filteredEditItems.length === 0 && <p className="text-sm text-neutral-400 py-4">No edit items.</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: Notes + Edit pipeline */}
            <div className="space-y-6">
              {/* Notes card */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-900">Notes</h3>
                  <button
                    onClick={() => setActiveView('notes')}
                    className="text-sm text-accent font-medium hover:underline"
                  >
                    See all
                  </button>
                </div>
                <div className="p-6">
                  <button
                    onClick={() => setEditingNote({} as WorkNote)}
                    className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 mb-4"
                  >
                    <Plus className="w-4 h-4" />
                    New note
                  </button>
                  <ul className="space-y-2">
                    {recentNotes.length === 0 ? (
                      <li className="text-sm text-neutral-400 py-2">No notes yet</li>
                    ) : (
                      recentNotes.map((note) => (
                        <li key={note.id}>
                          <button
                            onClick={() => setEditingNote(note)}
                            className="w-full text-left p-3 rounded-xl hover:bg-neutral-50 transition-colors"
                          >
                            <p className="text-sm font-medium text-neutral-900 truncate">{note.title || 'Untitled'}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {new Date(note.updated_at).toLocaleDateString()}
                            </p>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              {/* Edit pipeline card */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-900">Edit list</h3>
                  <button
                    onClick={() => setActiveView('edits')}
                    className="text-sm text-accent font-medium hover:underline"
                  >
                    See all
                </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-xl bg-neutral-50">
                      <p className="text-lg font-bold text-neutral-900">{editStats.queued}</p>
                      <p className="text-xs text-neutral-500">Queued</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-accent/10">
                      <p className="text-lg font-bold text-accent">{editStats.inProgress}</p>
                      <p className="text-xs text-neutral-500">In progress</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-green-50">
                      <p className="text-lg font-bold text-green-700">{editStats.done}</p>
                      <p className="text-xs text-neutral-500">Done</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {recentEdits.length === 0 ? (
                      <li className="text-sm text-neutral-400 py-2">No edits in pipeline</li>
                    ) : (
                      recentEdits.map((item) => (
                        <li key={item.id}>
                          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50">
                            <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                              item.status === 'in_progress' ? 'bg-accent' : 'bg-neutral-300'
                            }`} />
                            <span className="text-sm text-neutral-900 truncate flex-1 min-w-0">{item.title}</span>
                            <span className="text-xs text-neutral-500 flex-shrink-0">
                              {item.status === 'in_progress' ? 'In progress' : 'Queued'}
                            </span>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== MOBILE: Single column ========== */}
        <div className="lg:hidden">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Work</h1>
            <p className="text-sm text-neutral-500">Notes, tasks, and edits</p>
          </div>

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
            <div className="bg-white rounded-2xl shadow-sm p-3">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Edit title…"
                  value={newEditTitle}
                  onChange={(e) => setNewEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddEditItem();
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 rounded-lg border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <div className="flex gap-1.5">
                  {tokenOptions.map((tokens) => (
                    <button
                      key={tokens}
                      onClick={() => setSelectedEditTokens(tokens)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        selectedEditTokens === tokens
                          ? 'bg-accent text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      +{tokens}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    value={newEditType}
                    onChange={(e) => setNewEditType(e.target.value as EditItemType)}
                    className="flex-1 px-3 py-2 bg-neutral-50 rounded-lg border-0 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {editTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddEditItem}
                    className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
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
