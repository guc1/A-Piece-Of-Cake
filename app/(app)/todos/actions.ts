'use server';

import {
  createTodo as createStore,
  updateTodo as updateStore,
  deleteTodo as deleteStore,
} from '@/lib/todos-store';
import { assertOwner } from '@/lib/profile';
import type { Todo } from '@/types/todo';
import { revalidatePath } from 'next/cache';

function sanitize(form: FormData) {
  const obj: any = {};
  if (form.has('title')) {
    obj.title = String(form.get('title') || '').slice(0, 80);
  }
  if (form.has('description')) {
    obj.description = (form.get('description') || '').toString();
  }
  if (form.has('priority')) {
    obj.priority = clamp(Number(form.get('priority')));
  }
  if (form.has('icon')) {
    const ic = form.get('icon');
    obj.icon = typeof ic === 'string' ? ic : '✅';
  }
  if (form.has('visibility')) {
    const vis = form.get('visibility') as string;
    obj.visibility = ['private', 'followers', 'friends', 'public'].includes(vis)
      ? vis
      : 'public';
  }
  if (form.has('dueAt')) {
    const val = form.get('dueAt');
    const d = val ? new Date(String(val)) : null;
    if (d && !isNaN(d.getTime())) obj.dueAt = d.toISOString();
  }
  if (form.has('completed')) {
    obj.completed = form.get('completed') === 'true';
  }
  return obj;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function createTodo(
  ownerId: number,
  formData: FormData,
): Promise<Todo> {
  await assertOwner(ownerId, ownerId);
  const data = sanitize(formData);
  const todo = await createStore(String(ownerId), data);
  revalidatePath('/todos');
  return todo;
}

export async function updateTodo(
  ownerId: number,
  id: number,
  formData: FormData,
): Promise<Todo | null> {
  await assertOwner(ownerId, ownerId);
  const data = sanitize(formData);
  const todo = await updateStore(String(ownerId), id, data);
  revalidatePath('/todos');
  return todo;
}

export async function deleteTodo(
  ownerId: number,
  id: number,
): Promise<boolean> {
  await assertOwner(ownerId, ownerId);
  const ok = await deleteStore(String(ownerId), id);
  revalidatePath('/todos');
  return ok;
}
