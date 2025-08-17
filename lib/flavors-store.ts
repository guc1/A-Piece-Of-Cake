import { db } from './db';
import { flavors } from './db/schema';
import { eq, and } from 'drizzle-orm';
import type { Flavor, FlavorInput, Visibility } from '@/types/flavor';

function sortFlavors(list: Flavor[]) {
  return list.sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function toFlavor(row: typeof flavors.$inferSelect): Flavor {
  return {
    id: row.id,
    userId: row.userId?.toString() ?? '',
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

export async function listFlavors(userId: string): Promise<Flavor[]> {
  const rows = await db
    .select()
    .from(flavors)
    .where(eq(flavors.userId, Number(userId)));
  return sortFlavors(rows.map(toFlavor));
}

export async function getFlavor(userId: string, id: string): Promise<Flavor | null> {
  const [row] = await db
    .select()
    .from(flavors)
    .where(and(eq(flavors.userId, Number(userId)), eq(flavors.id, id)));
  return row ? toFlavor(row) : null;
}

export async function createFlavor(userId: string, input: FlavorInput): Promise<Flavor> {
  const id = crypto.randomUUID();
  const now = new Date();
  const [row] = await db
    .insert(flavors)
    .values({
      id,
      userId: Number(userId),
      slug:
        input.slug ||
        input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
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
  return toFlavor(row);
}

export async function updateFlavor(
  userId: string,
  id: string,
  input: Partial<FlavorInput>
): Promise<Flavor | null> {
  const now = new Date();
  const [row] = await db
    .update(flavors)
    .set({
      slug: input.slug,
      name: input.name ? input.name.slice(0, 40) : undefined,
      description: input.description ? input.description.slice(0, 280) : undefined,
      color: input.color,
      icon: input.icon,
      importance: input.importance !== undefined ? clamp(input.importance) : undefined,
      targetMix: input.targetMix !== undefined ? clamp(input.targetMix) : undefined,
      visibility: input.visibility,
      orderIndex: input.orderIndex,
      updatedAt: now,
    })
    .where(and(eq(flavors.userId, Number(userId)), eq(flavors.id, id)))
    .returning();
  return row ? toFlavor(row) : null;
}

export async function deleteFlavor(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(flavors)
    .where(and(eq(flavors.userId, Number(userId)), eq(flavors.id, id)))
    .returning();
  return rows.length > 0;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
