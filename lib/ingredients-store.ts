import { db } from './db';
import { ingredients, ingredientRevisions, follows } from './db/schema';
import { eq, and, desc, lte } from 'drizzle-orm';
import type { Ingredient, IngredientInput, Visibility } from '@/types/ingredient';

function sortIngredients(list: Ingredient[]) {
  return list.sort((a, b) => {
    if (b.usefulness !== a.usefulness) return b.usefulness - a.usefulness;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function toIngredient(row: typeof ingredients.$inferSelect): Ingredient {
  return {
    id: row.id,
    userId: row.userId ?? 0,
    title: row.title ?? '',
    shortDescription: row.shortDescription ?? '',
    description: row.description ?? '',
    whyUsed: row.whyUsed ?? '',
    whenUsed: row.whenUsed ?? '',
    tips: row.tips ?? '',
    usefulness: row.usefulness ?? 0,
    imageUrl: row.imageUrl ?? null,
    icon: row.icon ?? '⭐',
    tags: row.tags ?? null,
    visibility: (row.visibility as Visibility) ?? 'private',
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

async function canView(viewerId: number | null, ownerId: number, vis: Visibility) {
  if (viewerId === ownerId) return true;
  switch (vis) {
    case 'public':
      return true;
    case 'followers':
      if (!viewerId) return false;
      const [f1] = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, ownerId)));
      return !!f1 && f1.status === 'accepted';
    case 'friends':
      if (!viewerId) return false;
      const [f2] = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, ownerId)));
      const [f3] = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, ownerId), eq(follows.followingId, viewerId)));
      return f2?.status === 'accepted' && f3?.status === 'accepted';
    case 'private':
    default:
      return false;
  }
}

export async function listIngredients(
  userId: string,
  viewerId: number | null = null,
  at?: Date,
): Promise<Ingredient[]> {
  const rows = await db.select().from(ingredients).where(eq(ingredients.userId, Number(userId)));
  const list: Ingredient[] = [];
  for (const row of rows) {
    if (!(await canView(viewerId, row.userId ?? 0, (row.visibility as Visibility) ?? 'private')))
      continue;
    let base = toIngredient(row);
    if (at) {
      const [rev] = await db
        .select()
        .from(ingredientRevisions)
        .where(and(eq(ingredientRevisions.ingredientId, row.id), lte(ingredientRevisions.snapshotAt, at)))
        .orderBy(desc(ingredientRevisions.snapshotAt))
        .limit(1);
      if (rev) {
        base = { ...base, ...(rev.payload as any) };
      }
    }
    list.push(base);
  }
  return sortIngredients(list);
}

export async function getIngredient(
  userId: string,
  id: number,
  viewerId: number | null = null,
  at?: Date,
): Promise<Ingredient | null> {
  const [row] = await db
    .select()
    .from(ingredients)
    .where(and(eq(ingredients.userId, Number(userId)), eq(ingredients.id, id)));
  if (!row) return null;
  if (!(await canView(viewerId, row.userId ?? 0, (row.visibility as Visibility) ?? 'private')))
    return null;
  let base = toIngredient(row);
  if (at) {
    const [rev] = await db
      .select()
      .from(ingredientRevisions)
      .where(and(eq(ingredientRevisions.ingredientId, row.id), lte(ingredientRevisions.snapshotAt, at)))
      .orderBy(desc(ingredientRevisions.snapshotAt))
      .limit(1);
    if (rev) {
      base = { ...base, ...(rev.payload as any) };
    }
  }
  return base;
}

export async function createIngredient(
  userId: string,
  input: IngredientInput,
): Promise<Ingredient> {
  const now = new Date();
  const [row] = await db
    .insert(ingredients)
    .values({
      userId: Number(userId),
      title: input.title.slice(0, 80),
      shortDescription: input.shortDescription?.slice(0, 160),
      description: input.description,
      whyUsed: input.whyUsed,
      whenUsed: input.whenUsed,
      tips: input.tips,
      usefulness: clamp(input.usefulness),
      imageUrl: input.imageUrl,
      icon: input.icon,
      tags: input.tags ?? null,
      visibility: input.visibility,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const ing = toIngredient(row);
  await db.insert(ingredientRevisions).values({
    ingredientId: ing.id,
    payload: {
      title: ing.title,
      shortDescription: ing.shortDescription,
      description: ing.description,
      whyUsed: ing.whyUsed,
      whenUsed: ing.whenUsed,
      tips: ing.tips,
      usefulness: ing.usefulness,
      imageUrl: ing.imageUrl,
      icon: ing.icon,
      tags: ing.tags,
    },
  });
  return ing;
}

export async function updateIngredient(
  userId: string,
  id: number,
  input: Partial<IngredientInput>,
): Promise<Ingredient | null> {
  const now = new Date();
  const [row] = await db
    .update(ingredients)
    .set({
      title: input.title ? input.title.slice(0, 80) : undefined,
      shortDescription: input.shortDescription
        ? input.shortDescription.slice(0, 160)
        : undefined,
      description: input.description,
      whyUsed: input.whyUsed,
      whenUsed: input.whenUsed,
      tips: input.tips,
      usefulness:
        input.usefulness !== undefined ? clamp(input.usefulness) : undefined,
      imageUrl: input.imageUrl,
      icon: input.icon,
      tags: input.tags,
      visibility: input.visibility,
      updatedAt: now,
    })
    .where(and(eq(ingredients.userId, Number(userId)), eq(ingredients.id, id)))
    .returning();
  if (!row) return null;
  const ing = toIngredient(row);
  await db.insert(ingredientRevisions).values({
    ingredientId: ing.id,
    payload: {
      title: ing.title,
      shortDescription: ing.shortDescription,
      description: ing.description,
      whyUsed: ing.whyUsed,
      whenUsed: ing.whenUsed,
      tips: ing.tips,
      usefulness: ing.usefulness,
      imageUrl: ing.imageUrl,
      icon: ing.icon,
      tags: ing.tags,
    },
  });
  return ing;
}

export async function deleteIngredient(
  userId: string,
  id: number,
): Promise<boolean> {
  const rows = await db
    .delete(ingredients)
    .where(and(eq(ingredients.userId, Number(userId)), eq(ingredients.id, id)))
    .returning();
  return rows.length > 0;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
