'use server';

import { auth } from '@/lib/auth';
import {
  createFlavor as createFlavorStore,
  updateFlavor as updateFlavorStore,
  getFlavor,
} from '@/lib/flavors-store';
import { ensureUser } from '@/lib/users';
import { revalidatePath } from 'next/cache';
import type { Flavor, FlavorInput } from '@/types/flavor';
import { assertOwner } from '@/lib/profile';
import { listSubflavors, createSubflavor } from '@/lib/subflavors-store';

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
  await assertOwner(self.id, self.id);
  const flavor = await createFlavorStore(String(self.id), sanitize(form));
  revalidatePath('/flavors');
  return flavor;
}

export async function updateFlavor(id: string, form: any): Promise<Flavor> {
  const session = await auth();
  const self = await ensureUser(session);
  await assertOwner(self.id, self.id);
  const updated = await updateFlavorStore(
    String(self.id),
    id,
    sanitize(form),
  );
  if (!updated) {
    throw new Error('Not found');
  }
  revalidatePath('/flavors');
  return updated;
}

export async function copyFlavor(
  fromUserId: string,
  flavorId: string,
  withSubs: boolean,
) {
  const session = await auth();
  const self = await ensureUser(session);
    const source = await getFlavor(fromUserId, flavorId, Number(self.id));
  if (!source) throw new Error('Not found');
  const created = await createFlavorStore(String(self.id), {
    name: source.name,
    description: source.description,
    color: source.color,
    icon: source.icon,
    importance: source.importance,
    targetMix: source.targetMix,
    visibility: source.visibility,
    orderIndex: source.orderIndex,
    slug: source.slug,
  });
  if (withSubs) {
    const subs = await listSubflavors(fromUserId, flavorId);
    for (const s of subs) {
      await createSubflavor(String(self.id), created.id, {
        flavorId: created.id,
        name: s.name,
        description: s.description,
        color: s.color,
        icon: s.icon,
        importance: s.importance,
        targetMix: s.targetMix,
        visibility: s.visibility,
        orderIndex: s.orderIndex,
        slug: s.slug,
      });
    }
    revalidatePath(`/flavors/${created.id}/subflavors`);
  }
  revalidatePath('/flavors');
  return created;
}
