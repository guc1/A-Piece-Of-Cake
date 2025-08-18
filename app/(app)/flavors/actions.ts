'use server';

import {
  createFlavor as createFlavorStore,
  updateFlavor as updateFlavorStore,
} from '@/lib/flavors-store';
import { revalidatePath } from 'next/cache';
import type { Flavor, FlavorInput } from '@/types/flavor';
import { assertOwner } from '@/lib/profile';

function sanitize(body: any): FlavorInput {
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
    name: body.name,
    description,
    color,
    icon,
    importance,
    targetMix,
    visibility,
    orderIndex,
    slug: typeof body.slug === 'string' ? body.slug : undefined,
  } as FlavorInput;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function createFlavor(
  boundOwnerId: number,
  form: any,
): Promise<Flavor> {
  await assertOwner(boundOwnerId);
  const flavor = await createFlavorStore(
    String(boundOwnerId),
    sanitize(form),
  );
  revalidatePath('/flavors');
  return flavor;
}

export async function updateFlavor(
  boundOwnerId: number,
  id: string,
  form: any,
): Promise<Flavor> {
  await assertOwner(boundOwnerId);
  const updated = await updateFlavorStore(
    String(boundOwnerId),
    id,
    sanitize(form),
  );
  if (!updated) {
    throw new Error('Not found');
  }
  revalidatePath('/flavors');
  return updated;
}
