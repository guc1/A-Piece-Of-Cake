import { db } from './db';
import { subflavors } from './db/schema';
import { eq, and } from 'drizzle-orm';
import type { Subflavor, SubflavorInput, Visibility } from '@/types/subflavor';

function sortSubflavors(list: Subflavor[]) {
  return list.sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function toSubflavor(row: typeof subflavors.$inferSelect): Subflavor {
  return {
    id: row.id,
    userId: row.userId?.toString() ?? '',
    flavorId: row.flavorId ?? '',
    slug: row.slug,
    name: row.name ?? '',
    description: row.description ?? '',
    color: row.color ?? '#888888',
    icon: row.icon ?? '⭐',
    importance: row.importance ?? 0,
    targetMix: row.targetMix ?? 0,
    visibility: (row.visibility as Visibility) ?? 'private',
    orderIndex: row.orderIndex ?? 0,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function listSubflavors(
  userId: string,
  flavorId: string,
): Promise<Subflavor[]> {
  const id = Number(userId);
  if (Number.isNaN(id)) return [];
  const rows = await db
    .select()
    .from(subflavors)
    .where(and(eq(subflavors.userId, id), eq(subflavors.flavorId, flavorId)));
  return sortSubflavors(rows.map(toSubflavor));
}

export async function getSubflavor(
  userId: string,
  id: string,
): Promise<Subflavor | null> {
  const [row] = await db
    .select()
    .from(subflavors)
    .where(and(eq(subflavors.userId, Number(userId)), eq(subflavors.id, id)));
  return row ? toSubflavor(row) : null;
}

export async function createSubflavor(
  userId: string,
  flavorId: string,
  input: SubflavorInput,
): Promise<Subflavor> {
  const id = crypto.randomUUID();
  const now = new Date();
  const [row] = await db
    .insert(subflavors)
    .values({
      id,
      userId: Number(userId),
      flavorId,
      slug:
        input.slug ||
        input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 40),
      name: input.name.slice(0, 40),
      description: input.description.slice(0, 280),
      color: input.color,
      icon: input.icon,
      importance: clamp(input.importance),
      targetMix: clamp(input.targetMix),
      visibility: input.visibility,
      orderIndex: input.orderIndex ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return toSubflavor(row);
}

export async function updateSubflavor(
  userId: string,
  id: string,
  input: Partial<SubflavorInput>,
): Promise<Subflavor | null> {
  const now = new Date();
  const [row] = await db
    .update(subflavors)
    .set({
      slug: input.slug,
      name: input.name ? input.name.slice(0, 40) : undefined,
      description: input.description
        ? input.description.slice(0, 280)
        : undefined,
      color: input.color,
      icon: input.icon,
      importance:
        input.importance !== undefined ? clamp(input.importance) : undefined,
      targetMix:
        input.targetMix !== undefined ? clamp(input.targetMix) : undefined,
      visibility: input.visibility,
      orderIndex: input.orderIndex,
      updatedAt: now,
    })
    .where(and(eq(subflavors.userId, Number(userId)), eq(subflavors.id, id)))
    .returning();
  return row ? toSubflavor(row) : null;
}

export async function deleteSubflavor(
  userId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .delete(subflavors)
    .where(and(eq(subflavors.userId, Number(userId)), eq(subflavors.id, id)))
    .returning();
  return rows.length > 0;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
