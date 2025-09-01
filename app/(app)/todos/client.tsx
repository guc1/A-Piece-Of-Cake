'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import IconPicker from '@/components/icon-picker';
import type { Todo, TodoInput, Visibility } from '@/types/todo';
import { useViewContext } from '@/lib/view-context';
import { createTodo as createAction } from './actions';
import { Button } from '@/components/ui/button';

const VISIBILITIES: Visibility[] = ['private', 'followers', 'friends', 'public'];

function sortTodos(list: Todo[]) {
  return [...list].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export default function TodosClient({
  userId,
  initialTodos,
}: {
  userId: string;
  initialTodos: Todo[];
}) {
  const { editable } = useViewContext();
  const [todos, setTodos] = useState(() => sortTodos(initialTodos));
  const [form, setForm] = useState<TodoInput>({
    title: '',
    description: '',
    priority: 50,
    icon: '✅',
    visibility: 'public',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editable) return;
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description || '');
    fd.append('priority', String(form.priority));
    fd.append('icon', form.icon);
    fd.append('visibility', form.visibility || 'public');
    const todo = await createAction(Number(userId), fd);
    setTodos((prev) => sortTodos([...prev, todo]));
    setForm({ title: '', description: '', priority: 50, icon: '✅', visibility: 'public' });
  }

  return (
    <div id={`todo-list-${userId}`} className="space-y-4 p-4">
      {editable && (
        <form
          id={`todo-form-${userId}`}
          onSubmit={handleSubmit}
          className="space-y-2 rounded border p-4"
        >
          <div>
            <label className="block text-sm font-medium" htmlFor={`todo-title-${userId}`}>
              Title
            </label>
            <input
              id={`todo-title-${userId}`}
              className="w-full border p-1"
              value={form.title}
              maxLength={80}
              required
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor={`todo-desc-${userId}`}>
              Description
            </label>
            <textarea
              id={`todo-desc-${userId}`}
              className="w-full border p-1"
              value={form.description}
              rows={3}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor={`todo-pri-${userId}`}>
              Priority ({form.priority})
            </label>
            <input
              id={`todo-pri-${userId}`}
              type="range"
              min={0}
              max={100}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Icon</label>
            <IconPicker
              value={form.icon}
              onChange={(ic) => setForm({ ...form, icon: ic })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Visibility</label>
            <select
              id={`todo-vis-${userId}`}
              className="border p-1"
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value as Visibility })}
            >
              {VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <Button id={`todo-submit-${userId}`} type="submit">
            Add
          </Button>
        </form>
      )}
      <ul className="space-y-2">
        {todos.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-2 rounded border p-2"
          >
            <span>{t.icon}</span>
            <span className="font-medium">{t.title}</span>
            <span className="text-xs text-gray-500">{t.priority}</span>
          </li>
        ))}
      </ul>
      {todos.length === 0 && <p id={`todo-empty-${userId}`}>No to-dos yet.</p>}
    </div>
  );
}
