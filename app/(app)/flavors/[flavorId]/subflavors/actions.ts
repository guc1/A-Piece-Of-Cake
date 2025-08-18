'use server';

import { auth } from '@/lib/auth';
import {
  createSubflavor as createSubflavorStore,
  updateSubflavor as updateSubflavorStore,
} from '@/lib/subflavors-store';
import { revalidatePath } from 'next/cache';
import type { Subflavor, SubflavorInput } from '@/types/subflavor';
import { assertOwner } from '@/lib/profile';

function sanitize(body: any): SubflavorInput {
  if (
    !body.name ||
    typeof body.name !== 'string' ||
    body.name.length < 2 ||
    body.name.length > 40
  ) {
    throw new Error('Invalid name');
  }
  const description =
    typeof body.description === 'string' ? body.description.slice(0, 280) : '';
  const color =
    typeof body.color === 'string' && /^#?[0-9a-fA-F]{6}$/.test(body.color)
      ? body.color.startsWith('#')
        ? body.color
        : '#' + body.color
      : '#888888';
  const icon = typeof body.icon === 'string' ? body.icon : '⭐';
  const importance = clamp(Number(body.importance));
  const targetMix = clamp(Number(body.targetMix));
  const visibility: any = [
    'private',
    'friends',
    'followers',
    'public',
  ].includes(body.visibility)
    ? body.visibility
    : 'private';
  const orderIndex = typeof body.orderIndex === 'number' ? body.orderIndex : 0;
  return {
    flavorId: body.flavorId,
    name: body.name,
    description,
    color,
    icon,
    importance,
    targetMix,
    visibility,
    orderIndex,
    slug: typeof body.slug === 'string' ? body.slug : undefined,
  } as SubflavorInput;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function createSubflavor(
  flavorId: string,
  form: any,
): Promise<Subflavor> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error('Please sign in.');
  }
  assertOwner(Number(userId), Number(userId));
  const subflavor = await createSubflavorStore(
    userId,
    flavorId,
    sanitize({ ...form, flavorId }),
  );
  revalidatePath(`/flavors/${flavorId}/subflavors`);
  return subflavor;
}

export async function updateSubflavor(
  flavorId: string,
  id: string,
  form: any,
): Promise<Subflavor> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error('Please sign in.');
  }
  assertOwner(Number(userId), Number(userId));
  const updated = await updateSubflavorStore(userId, id, sanitize(form));
  if (!updated) {
    throw new Error('Not found');
  }
  revalidatePath(`/flavors/${flavorId}/subflavors`);
  return updated;
}
