'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import IconPicker from '@/components/icon-picker';
import type { Todo, TodoInput, Visibility } from '@/types/todo';
import { useViewContext } from '@/lib/view-context';
import {
  createTodo as createAction,
  updateTodo as updateAction,
  deleteTodo as deleteAction,
} from './actions';
import { Button } from '@/components/ui/button';

const VISIBILITIES: Visibility[] = [
  'private',
  'followers',
  'friends',
  'public',
];

function sortTodos(list: Todo[]) {
  return [...list].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function iconSrc(ic: string) {
  if (ic.startsWith('data:')) return ic;
  if (/^[A-Za-z0-9+/=]+$/.test(ic)) return `data:image/png;base64,${ic}`;
  return null;
}

function toLocalInput(s: string) {
  const d = new Date(s);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function formatTimeLeft(due: string, now: number) {
  const ms = new Date(due).getTime() - now;
  if (ms <= 0) return { text: 'Past due', className: 'text-red-500' };
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  let text = '';
  if (days > 0) text = `${days}d ${hours}h`;
  else if (hours > 0) text = `${hours}h ${minutes}m`;
  else text = `${minutes}m`;
  let className = 'text-green-500';
  if (ms < 5 * 60 * 60 * 1000) className = 'text-red-500';
  else if (ms < 2 * 24 * 60 * 60 * 1000) className = 'text-orange-500';
  return { text, className };
}

export default function TodosClient({
  userId,
  initialTodos,
}: {
  userId: string;
  initialTodos: Todo[];
}) {
  const { editable } = useViewContext();
  const [todos, setTodos] = useState(() => initialTodos);
  const [form, setForm] = useState<TodoInput>({
    title: '',
    description: '',
    priority: 50,
    icon: '✅',
    visibility: 'public',
    dueAt: '',
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editable) return;
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description || '');
    fd.append('priority', String(form.priority));
    fd.append('icon', form.icon);
    fd.append('visibility', form.visibility || 'public');
    if (form.dueAt) {
      fd.append('dueAt', new Date(form.dueAt).toISOString());
    }
    if (editing) {
      const todo = await updateAction(Number(userId), editing.id, fd);
      if (todo) {
        setTodos((prev) =>
          prev.map((t) => (t.id === editing.id ? todo : t)),
        );
      }
    } else {
      const todo = await createAction(Number(userId), fd);
      setTodos((prev) => [...prev, todo]);
    }
    setForm({
      title: '',
      description: '',
      priority: 50,
      icon: '✅',
      visibility: 'public',
      dueAt: '',
    });
    setEditing(null);
    setOpen(false);
  }

  async function handleComplete(id: number) {
    if (!editable) return;
    const fd = new FormData();
    fd.append('completed', 'true');
    const todo = await updateAction(Number(userId), id, fd);
    if (todo) {
      setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)));
    }
  }

  async function handleDelete(id: number) {
    if (!editable) return;
    const ok = await deleteAction(Number(userId), id);
    if (ok) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  }

  function handleEdit(todo: Todo) {
    if (!editable) return;
    setEditing(todo);
    setForm({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      icon: todo.icon,
      visibility: todo.visibility,
      dueAt: todo.dueAt ? toLocalInput(todo.dueAt) : '',
    });
    setOpen(true);
  }

  return (
    <div id={`todo-list-${userId}`} className="space-y-4 p-4">
      {editable && (
        <Button
          id={`todo-add-${userId}`}
          onClick={() => {
            setEditing(null);
            setForm({
              title: '',
              description: '',
              priority: 50,
              icon: '✅',
              visibility: 'public',
              dueAt: '',
            });
            setOpen(true);
          }}
        >
          + Add To Do
        </Button>
      )}
      {editable && open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <form
            id={`todo-form-${userId}`}
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-2 rounded bg-white p-6 shadow-lg"
          >
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor={`todo-title-${userId}`}
              >
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
              <label
                className="block text-sm font-medium"
                htmlFor={`todo-desc-${userId}`}
              >
                Description
              </label>
              <textarea
                id={`todo-desc-${userId}`}
                className="w-full border p-1"
                value={form.description}
                rows={3}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor={`todo-due-${userId}`}
              >
                Finish Before
              </label>
              <input
                id={`todo-due-${userId}`}
                type="datetime-local"
                className="w-full border p-1"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor={`todo-pri-${userId}`}
              >
                Priority ({form.priority})
              </label>
              <input
                id={`todo-pri-${userId}`}
                type="range"
                min={0}
                max={100}
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: Number(e.target.value) })
                }
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
                onChange={(e) =>
                  setForm({ ...form, visibility: e.target.value as Visibility })
                }
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button id={`todo-submit-${userId}`} type="submit">
                {editing ? 'Save' : 'Add'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
      {(() => {
        const active = sortTodos(todos.filter((t) => !t.completed));
        const done = sortTodos(todos.filter((t) => t.completed));
        return (
          <>
            <ul className="space-y-2">
              {active.map((t) => {
                const info = t.dueAt ? formatTimeLeft(t.dueAt, now) : null;
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 rounded border p-2"
                  >
                    {iconSrc(t.icon) ? (
                      <img
                        src={iconSrc(t.icon) as string}
                        alt="icon"
                        className="h-6 w-6 rounded object-cover"
                      />
                    ) : (
                      <span>{t.icon}</span>
                    )}
                    <div className="flex-1">
                      <span className="font-medium">{t.title}</span>
                      {t.dueAt && (
                        <span className={`block text-xs ${info!.className}`}>
                          Finish before {new Date(t.dueAt).toLocaleString()} (
                          {info!.text} left)
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{t.priority}</span>
                    {editable && (
                      <>
                        {!t.completed && (
                          <Button
                            size="sm"
                            onClick={() => handleComplete(t.id)}
                          >
                            Completed
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(t)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(t.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            {done.length > 0 && (
              <>
                <h3 className="mt-4 font-semibold">Completed</h3>
                <ul className="space-y-2">
                  {done.map((t) => {
                    const info = t.dueAt ? formatTimeLeft(t.dueAt, now) : null;
                    return (
                      <li
                        key={t.id}
                        className="flex items-center gap-2 rounded border p-2 bg-green-100"
                      >
                        {iconSrc(t.icon) ? (
                          <img
                            src={iconSrc(t.icon) as string}
                            alt="icon"
                            className="h-6 w-6 rounded object-cover"
                          />
                        ) : (
                          <span>{t.icon}</span>
                        )}
                        <div className="flex-1">
                          <span className="font-medium">{t.title}</span>
                          {t.dueAt && (
                            <span
                              className={`block text-xs ${info!.className}`}
                            >
                              Finish before {new Date(t.dueAt).toLocaleString()} (
                              {info!.text} left)
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {t.priority}
                        </span>
                        {editable && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(t)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(t.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {todos.length === 0 && (
              <p id={`todo-empty-${userId}`}>No to-dos yet.</p>
            )}
          </>
        );
      })()}
    </div>
  );
}
