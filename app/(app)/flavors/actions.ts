'use server';

import { auth } from '@/lib/auth';
import { createFlavor as create, updateFlavor as update } from '@/lib/flavors-store';
import type { FlavorInput } from '@/types/flavor';
import { revalidatePath } from 'next/cache';

function sanitize(body: any): FlavorInput {
  if (!body.name || body.name.length < 2 || body.name.length > 40) {
    throw new Error('Invalid name');
  }
  const description = typeof body.description === 'string' ? body.description.slice(0, 280) : '';
  const color =
    typeof body.color === 'string' && /^#?[0-9a-fA-F]{6}$/.test(body.color)
      ? body.color.startsWith('#')
        ? body.color
        : '#' + body.color
      : '#888888';
  const icon = typeof body.icon === 'string' ? body.icon : '⭐';
  const importance = clamp(Number(body.importance));
  const targetMix = clamp(Number(body.targetMix));
  const visibility: any = ['private', 'friends', 'followers', 'public'].includes(body.visibility)
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

export async function createFlavor(input: any) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) {
    throw new Error('Please sign in.');
  }
  const flavor = create(userId, sanitize(input));
  revalidatePath('/flavors');
  return flavor;
}

export async function updateFlavor(id: string, input: any) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) {
    throw new Error('Please sign in.');
  }
  const flavor = update(userId, id, sanitize(input));
  if (!flavor) {
    throw new Error('Not found');
  }
  revalidatePath('/flavors');
  return flavor;
}
