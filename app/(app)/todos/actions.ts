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
  for (const [key, value] of form.entries()) {
    obj[key] = value as any;
  }
  obj.priority = clamp(Number(obj.priority));
  obj.title = String(obj.title || '').slice(0, 80);
  obj.description = (obj.description || '').toString();
  obj.icon = typeof obj.icon === 'string' ? obj.icon : '✅';
  obj.visibility = ['private', 'followers', 'friends', 'public'].includes(
    obj.visibility,
  )
    ? obj.visibility
    : 'public';
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
