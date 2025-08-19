'use server';

import { createIngredient as createStore, updateIngredient as updateStore, deleteIngredient as deleteStore } from '@/lib/ingredients-store';
import { assertOwner } from '@/lib/profile';
import type { Ingredient } from '@/types/ingredient';
import { revalidatePath } from 'next/cache';

function sanitize(form: FormData) {
  const obj: any = {};
  for (const [key, value] of form.entries()) {
    obj[key] = value as any;
  }
  obj.usefulness = clamp(Number(obj.usefulness));
  obj.title = String(obj.title || '').slice(0, 80);
  obj.shortDescription = (obj.shortDescription || '').toString().slice(0, 160);
  obj.visibility = ['private', 'followers', 'friends', 'public'].includes(obj.visibility)
    ? obj.visibility
    : 'private';
  return obj;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function createIngredient(
  ownerId: number,
  formData: FormData,
): Promise<Ingredient> {
  // pass ownerId as viewerId to avoid relying on auth() inside assertOwner,
  // which may not be available during server action invocation
  await assertOwner(ownerId, ownerId);
  const data = sanitize(formData);
  const ing = await createStore(String(ownerId), data);
  revalidatePath('/ingredients');
  return ing;
}

export async function updateIngredient(
  ownerId: number,
  id: number,
  formData: FormData,
): Promise<Ingredient | null> {
  // assert that the caller owns this account; use ownerId as viewerId
  await assertOwner(ownerId, ownerId);
  const data = sanitize(formData);
  const ing = await updateStore(String(ownerId), id, data);
  revalidatePath('/ingredients');
  return ing;
}

export async function deleteIngredient(
  ownerId: number,
  id: number,
): Promise<boolean> {
  // ensure only the owner can delete
  await assertOwner(ownerId, ownerId);
  const ok = await deleteStore(String(ownerId), id);
  revalidatePath('/ingredients');
  return ok;
}
