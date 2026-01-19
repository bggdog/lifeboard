import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { ArrowLeft, Briefcase, Plus, Edit2, Trash2, X, Calendar, Video, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkNote, WorkNoteCategory, WORK_NOTE_CATEGORIES, Todo, Edit, EditType, EDIT_TYPES } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Check } from 'lucide-react';

const WorkNotes = () => {
  const navigate = useNavigate();
  const { state, addTodo, updateTodo, deleteTodo, reorderTodos, addWorkNote, updateWorkNote, deleteWorkNote, addEdit, updateEdit, deleteEdit } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<WorkNoteCategory>('Random');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<WorkNote | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showEditList, setShowEditList] = useState(true);
  const [newEditTitle, setNewEditTitle] = useState('');
  const [newEditType, setNewEditType] = useState<EditType>('short-form');

  // Get work todos for selected date
  const workTodos = (state.todos || [])
    .filter(t => t.isWork && t.workDate === selectedDate && !t.completed)
    .sort((a, b) => a.order - b.order);

  // Get work notes for selected category
  const categoryNotes = (state.workNotes || [])
    .filter(n => n.category === selectedCategory)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      const workNote: WorkNote = {
        id: `work-note-${Date.now()}-${Math.random()}`,
        content: newNoteContent.trim(),
        category: selectedCategory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addWorkNote(workNote);
      setNewNoteContent('');
      setShowAddNote(false);
    } catch (error: any) {
      console.error('Error adding note:', error);
      alert(`Failed to save note: ${error?.message || 'Unknown error'}\n\nMake sure the backend server is running and the work_notes table exists in Supabase.`);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    await updateTodo({
      ...todo,
      completed: !todo.completed,
      completedAt: todo.completed ? undefined : new Date().toISOString(),
    });
  };

  const handleDeleteTodo = async (id: string) => {
    await deleteTodo(id);
  };

  const handleAddWorkTodo = async () => {
    const newTodo: Todo = {
      id: `todo-${Date.now()}-${Math.random()}`,
      text: '',
      completed: false,
      createdAt: new Date().toISOString(),
      order: workTodos.length,
      isWork: true,
      workDate: selectedDate,
    };
    await addTodo(newTodo);
  };

  const handleAddEdit = async () => {
    if (!newEditTitle.trim()) return;

    const edit: Edit = {
      id: `edit-${Date.now()}-${Math.random()}`,
      title: newEditTitle.trim(),
      type: newEditType,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    await addEdit(edit);
    setNewEditTitle('');
    setNewEditType('short-form');
  };

  const handleToggleEdit = async (edit: Edit) => {
    await updateEdit({
      ...edit,
      completed: !edit.completed,
      completedAt: edit.completed ? undefined : new Date().toISOString(),
    });
  };

  const handleDeleteEdit = async (id: string) => {
    await deleteEdit(id);
  };

  const getEditsByType = (type: EditType) => {
    if (!state || !state.edits) return [];
    return state.edits.filter(e => e.type === type && !e.completed);
  };

  if (!state || state.loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-neutral-600 animate-pulse-subtle">Loading work notes...</p>
        </div>
      </div>
    );
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(workTodos);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    const updatedTodos = items.map((todo, index) => ({
      ...todo,
      order: index,
    }));

    await reorderTodos([...updatedTodos, ...state.todos.filter(t => !t.isWork || t.workDate !== selectedDate || t.completed)]);
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-button hover:bg-neutral-100 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600 transition-transform duration-200 hover:-translate-x-1" />
              </button>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                <h1 className="text-2xl font-bold text-neutral-900">Work Notes</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Edit List Section */}
        <div className="mb-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                <Film className="w-5 h-5 text-accent" />
                Edit List
              </h2>
              <button
                onClick={() => setShowEditList(!showEditList)}
                className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
              >
                {showEditList ? <X className="w-4 h-4 text-neutral-600" /> : <Plus className="w-4 h-4 text-neutral-600" />}
              </button>
            </div>

            {showEditList && (
              <div className="space-y-6">
                {/* Add New Edit */}
                <div className="p-5 bg-white rounded-card border-2 border-neutral-200 shadow-soft">
                  <h4 className="font-semibold text-neutral-900 mb-3">Add New Edit</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Edit Title
                      </label>
                      <input
                        type="text"
                        placeholder="Enter edit title (e.g., 'Video about productivity tips')"
                        value={newEditTitle}
                        onChange={(e) => setNewEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddEdit();
                          }
                        }}
                        className="input w-full text-base py-3 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                          Edit Type
                        </label>
                        <select
                          value={newEditType}
                          onChange={(e) => setNewEditType(e.target.value as EditType)}
                          className="input w-full text-base py-3 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20"
                        >
                          <option value="short-form">Short Form (100 💰)</option>
                          <option value="long-form">Long Form (250 💰)</option>
                          <option value="therapy-company-episode">Therapy Company Episode (750 💰)</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button 
                          onClick={handleAddEdit} 
                          className="btn-primary px-6 py-3 text-base font-semibold h-fit"
                          disabled={!newEditTitle.trim()}
                        >
                          Add Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Subsections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['short-form', 'long-form', 'therapy-company-episode'] as EditType[]).map((type) => {
                    const edits = getEditsByType(type);
                    const editInfo = EDIT_TYPES[type];
                    const icon = type === 'therapy-company-episode' ? Video : Film;
                    const IconComponent = icon;

                    return (
                      <div key={type} className="p-4 bg-gradient-to-br from-accent/5 to-accent/10 rounded-card border border-accent/20">
                        <div className="flex items-center gap-2 mb-3">
                          <IconComponent className="w-4 h-4 text-accent" />
                          <h3 className="font-semibold text-neutral-900">{editInfo.label}</h3>
                          <span className="text-xs text-yellow-600 font-medium ml-auto">
                            {editInfo.tokens} 💰
                          </span>
                        </div>
                        {edits.length === 0 ? (
                          <div className="text-sm text-neutral-500 text-center py-4">
                            No edits
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {edits.map((edit) => (
                              <div
                                key={edit.id}
                                className="flex items-center gap-2 p-2 bg-white rounded-button hover:bg-neutral-50 transition-colors"
                              >
                                <button
                                  onClick={() => handleToggleEdit(edit)}
                                  className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-colors flex items-center justify-center ${
                                    edit.completed
                                      ? 'bg-accent border-accent text-white'
                                      : 'border-neutral-300 hover:border-accent'
                                  }`}
                                >
                                  {edit.completed && <Check className="w-3 h-3" />}
                                </button>
                                <span className="flex-1 text-sm text-neutral-900">{edit.title}</span>
                                <button
                                  onClick={() => handleDeleteEdit(edit.id)}
                                  className="p-1 rounded-button hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Categories & Date Selector */}
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-neutral-600" />
                <h3 className="font-semibold text-neutral-900">Date</h3>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input"
              />
            </div>

            {/* Categories */}
            <div className="card p-4">
              <h3 className="font-semibold text-neutral-900 mb-3">Categories</h3>
              <div className="space-y-1">
                {WORK_NOTE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowAddNote(false);
                      setEditingNote(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-button transition-colors ${
                      selectedCategory === category
                        ? 'bg-accent text-white font-medium'
                        : 'hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column: Work Todos */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  To-Dos for {format(new Date(selectedDate), 'MMM d, yyyy')}
                </h3>
                <button
                  onClick={handleAddWorkTodo}
                  className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
                >
                  <Plus className="w-4 h-4 text-neutral-600" />
                </button>
              </div>

              {workTodos.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>No work todos for this date.</p>
                  <button
                    onClick={handleAddWorkTodo}
                    className="mt-3 text-sm text-accent hover:text-accent-dark font-medium"
                  >
                    Add your first work todo
                  </button>
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="work-todos">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {workTodos.map((todo, index) => (
                          <Draggable key={todo.id} draggableId={todo.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-3 rounded-button transition-all ${
                                  snapshot.isDragging
                                    ? 'bg-white shadow-card'
                                    : 'bg-neutral-50 hover:bg-neutral-100'
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="cursor-move">
                                  <div className="w-1 h-6 bg-neutral-300 rounded-full" />
                                </div>
                                <button
                                  onClick={() => handleToggleTodo(todo)}
                                  className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-colors flex items-center justify-center ${
                                    todo.completed
                                      ? 'bg-accent border-accent text-white'
                                      : 'border-neutral-300 hover:border-accent'
                                  }`}
                                >
                                  {todo.completed && <Check className="w-3 h-3" />}
                                </button>
                                <input
                                  type="text"
                                  value={todo.text}
                                  onChange={(e) => updateTodo({ ...todo, text: e.target.value })}
                                  onBlur={() => updateTodo(todo)}
                                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-neutral-900"
                                  placeholder="Work todo..."
                                />
                                <button
                                  onClick={() => handleDeleteTodo(todo.id)}
                                  className="p-1.5 rounded-button hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>

          {/* Right Column: Notes */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">{selectedCategory}</h3>
                <button
                  onClick={() => {
                    setShowAddNote(true);
                    setEditingNote(null);
                    setNewNoteContent('');
                  }}
                  className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
                >
                  <Plus className="w-4 h-4 text-neutral-600" />
                </button>
              </div>

              {showAddNote && (
                <div className="mb-4 p-4 bg-neutral-50 rounded-card">
                  <textarea
                    placeholder="Add a note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="input min-h-[120px] resize-none"
                    rows={5}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={async () => {
                        try {
                          if (editingNote) {
                            await updateWorkNote({
                              ...editingNote,
                              content: newNoteContent.trim(),
                              updatedAt: new Date().toISOString(),
                            });
                            setEditingNote(null);
                          } else {
                            await handleAddNote();
                            return; // handleAddNote already clears the form
                          }
                          setShowAddNote(false);
                          setNewNoteContent('');
                        } catch (error: any) {
                          console.error('Error saving note:', error);
                          alert(`Failed to save note: ${error?.message || 'Unknown error'}`);
                        }
                      }}
                      className="btn-primary text-sm"
                    >
                      {editingNote ? 'Update' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddNote(false);
                        setNewNoteContent('');
                        setEditingNote(null);
                      }}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {categoryNotes.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>No notes in this category yet.</p>
                  <button
                    onClick={() => setShowAddNote(true)}
                    className="mt-3 text-sm text-accent hover:text-accent-dark font-medium"
                  >
                    Add your first note
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryNotes.map((note) => (
                    <div
                      key={note.id}
                      className="group p-4 bg-neutral-50 rounded-card border border-neutral-200 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm text-neutral-500">
                          {format(new Date(note.updatedAt), 'MMM d, yyyy • h:mm a')}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingNote(note);
                              setNewNoteContent(note.content);
                              setShowAddNote(true);
                            }}
                            className="p-1.5 rounded-button hover:bg-white transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-neutral-600" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Delete this note?')) {
                                await deleteWorkNote(note.id);
                              }
                            }}
                            className="p-1.5 rounded-button hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      <div className="text-neutral-900 whitespace-pre-wrap">{note.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkNotes;
