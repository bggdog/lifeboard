import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { Todo } from '../../types';

const TodosModule = () => {
  const { state, addTodo, updateTodo, deleteTodo, reorderTodos } = useApp();
  const [newTodoText, setNewTodoText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodoTokens, setNewTodoTokens] = useState<number | undefined>(undefined);

  const activeTodos = state.todos.filter(t => !t.completed);
  const sortedTodos = [...activeTodos].sort((a, b) => a.order - b.order);

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return;

    try {
      const newTodo: Todo = {
        id: `todo-${Date.now()}-${Math.random()}`,
        text: newTodoText.trim(),
        completed: false,
        tokenReward: newTodoTokens,
        createdAt: new Date().toISOString(),
        order: state.todos.length,
      };

      await addTodo(newTodo);
      setNewTodoText('');
      setNewTodoTokens(undefined);
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error adding todo:', error);
      alert(`Failed to add todo: ${error?.message || 'Unknown error'}\n\nMake sure the backend server is running on port 3001.`);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    await updateTodo({
      ...todo,
      completed: !todo.completed,
      completedAt: todo.completed ? undefined : new Date().toISOString(),
    });
  };

  const handleDelete = async (todoId: string) => {
    await deleteTodo(todoId);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sortedTodos);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    const updatedTodos = items.map((todo, index) => ({
      ...todo,
      order: index,
    }));

    await reorderTodos([...updatedTodos, ...state.todos.filter(t => t.completed)]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">To-Dos</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
        >
          <Plus className="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-neutral-50 rounded-card space-y-2">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                await handleAddTodo();
              } else if (e.key === 'Escape') {
                setShowAddForm(false);
              }
            }}
            className="input"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="💰 Reward (optional)"
              value={newTodoTokens || ''}
              onChange={(e) => setNewTodoTokens(e.target.value ? parseInt(e.target.value) : undefined)}
              className="input flex-1"
              min="1"
            />
            <button 
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await handleAddTodo();
              }}
              className="btn-primary"
              type="button"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTodoText('');
                setNewTodoTokens(undefined);
              }}
              className="p-2 rounded-button hover:bg-white transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        </div>
      )}

      {sortedTodos.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <p>No to-dos. Add one to get started!</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="todos">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {sortedTodos.map((todo, index) => (
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
                          onClick={() => handleToggleComplete(todo)}
                          className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-neutral-300 hover:border-accent transition-colors flex items-center justify-center"
                        >
                          {todo.completed && <Check className="w-3 h-3 text-accent" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-neutral-900">{todo.text}</div>
                          {todo.tokenReward && (
                            <div className="text-xs text-neutral-500 mt-0.5">
                              +{todo.tokenReward} <span className="text-yellow-600">💰</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(todo.id)}
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
  );
};

export default TodosModule;
