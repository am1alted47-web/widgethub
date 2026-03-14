'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Check, Trash } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoWidgetProps {
  blur?: number;
  settings?: {
      todos?: Todo[];
      fontSizeFactor?: number;
      [key: string]: any;
  };
  onSettingsChange?: (settings: any) => void;
}

export default function TodoWidget({ blur = 0, settings, onSettingsChange }: TodoWidgetProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  // Sync from settings on mount or update
  useEffect(() => {
    if (settings?.todos) {
        setTodos(settings.todos);
    }
  }, [settings?.todos]);

  const updateTodos = (newTodos: Todo[]) => {
      setTodos(newTodos);
      if (onSettingsChange) {
          onSettingsChange({ todos: newTodos });
      }
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: input,
      completed: false
    };
    
    updateTodos([...todos, newTodo]);
    setInput('');
  };

  const toggleTodo = (id: string) => {
    updateTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTodo = (id: string) => {
    updateTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div 
        className="flex flex-col h-full w-full rounded-2xl p-4 overflow-hidden transition-colors duration-300"
        style={{ 
            backdropFilter: `blur(${blur}px)`,
            backgroundColor: `rgba(0, 0, 0, 0)`
        }}
    >
      <h3 className="font-bold mb-3 text-lg">To-Do</h3>
      
      <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-1 custom-scrollbar">
        {todos.length === 0 && <p className="opacity-30 text-xs text-center mt-4">No tasks yet</p>}
        {todos.map(todo => (
          <div key={todo.id} className="group flex items-center gap-2 bg-white/5 p-2 rounded-lg hover:bg-white/10 transition">
            <button 
              onClick={() => toggleTodo(todo.id)}
              className={`w-5 h-5 rounded border flex items-center justify-center transition ${todo.completed ? 'bg-green-500 border-green-500' : 'border-white/30 hover:border-white'}`}
            >
              {todo.completed && <Check size={12} className="text-black" />}
            </button>
            <span className={`flex-1 text-sm truncate ${todo.completed ? 'line-through opacity-30' : ''}`}>{todo.text}</span>
            <button 
              onClick={() => removeTodo(todo.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition p-1"
            >
              <Trash size={14} />
            </button>
          </div>
        ))}
      </div>

      <form 
        onSubmit={addTodo} 
        className="flex gap-2 isolate origin-bottom-left w-full"
        onPointerDown={e => e.stopPropagation()}
      >
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="New task..."
          className="flex-1 min-w-0 bg-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:bg-white/20 transition placeholder-white/30"
        />
        <button type="submit" className="flex-shrink-0 bg-white/10 rounded px-2 py-1 hover:bg-white/20 transition">
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
