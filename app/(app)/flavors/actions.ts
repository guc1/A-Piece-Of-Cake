'use server';

import { auth } from '@/lib/auth';
import {
  createFlavor as createFlavorStore,
  updateFlavor as updateFlavorStore,
} from '@/lib/flavors-store';
import { ensureUser } from '@/lib/users';
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

export async function createFlavor(form: any): Promise<Flavor> {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = String(self.id);
  assertOwner(self.id, self.id);
  const flavor = await createFlavorStore(userId, sanitize(form));
  revalidatePath('/flavors');
  return flavor;
}

export async function updateFlavor(id: string, form: any): Promise<Flavor> {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = String(self.id);
  assertOwner(self.id, self.id);
  const updated = await updateFlavorStore(userId, id, sanitize(form));
  if (!updated) {
    throw new Error('Not found');
  }
  revalidatePath('/flavors');
  return updated;
}
