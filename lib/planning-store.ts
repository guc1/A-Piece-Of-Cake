import { db } from './db';
import { plans, planBlocks } from './db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import type { Plan, PlanBlock, PlanBlockInput } from '@/types/plan';

function toPlan(row: typeof plans.$inferSelect): Plan {
  return {
    id: String(row.id),
    userId: String(row.userId),
    date: row.date ?? '',
    createdAt: row.createdAt?.toISOString() ?? '',
    updatedAt: row.updatedAt?.toISOString() ?? '',
  };
}

function toBlock(row: typeof planBlocks.$inferSelect): PlanBlock {
  return {
    id: String(row.id),
    planId: String(row.planId),
    start: row.start?.toISOString() ?? '',
    end: row.end?.toISOString() ?? '',
    title: row.title ?? '',
    description: row.description ?? '',
    color: row.color ?? '#60a5fa',
    createdAt: row.createdAt?.toISOString() ?? '',
    updatedAt: row.updatedAt?.toISOString() ?? '',
  };
}

export async function getPlan(
  userId: string,
  date: string,
): Promise<{ plan: Plan | null; blocks: PlanBlock[] }> {
  const [planRow] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, Number(userId)), eq(plans.date, date)));
  if (!planRow) return { plan: null, blocks: [] };
  const blockRows = await db
    .select()
    .from(planBlocks)
    .where(eq(planBlocks.planId, planRow.id))
    .orderBy(planBlocks.start);
  return { plan: toPlan(planRow), blocks: blockRows.map(toBlock) };
}

export async function savePlan(
  userId: string,
  date: string,
  items: PlanBlockInput[],
): Promise<PlanBlock[]> {
  let planRow = (
    await db
      .select()
      .from(plans)
      .where(and(eq(plans.userId, Number(userId)), eq(plans.date, date)))
  )[0];
  if (!planRow) {
    const [p] = await db
      .insert(plans)
      .values({ userId: Number(userId), date })
      .returning();
    planRow = p;
  }
  const existing = await db
    .select()
    .from(planBlocks)
    .where(eq(planBlocks.planId, planRow.id));
  const existingIds = new Set(existing.map((b) => String(b.id)));
  const inputIds = new Set(items.filter((b) => b.id).map((b) => String(b.id)));
  // upsert
  for (const item of items) {
    if (item.id && existingIds.has(String(item.id))) {
      await db
        .update(planBlocks)
        .set({
          start: new Date(item.start),
          end: new Date(item.end),
          title: item.title,
          description: item.description,
          color: item.color,
          updatedAt: new Date(),
        })
        .where(eq(planBlocks.id, Number(item.id)));
    } else {
      await db.insert(planBlocks).values({
        planId: planRow.id,
        start: new Date(item.start),
        end: new Date(item.end),
        title: item.title,
        description: item.description,
        color: item.color,
      });
    }
  }
  // delete removed
  const toDelete = [...existingIds].filter((id) => !inputIds.has(id));
  if (toDelete.length) {
    await db
      .delete(planBlocks)
      .where(inArray(planBlocks.id, toDelete.map(Number)));
  }
  const result = await db
    .select()
    .from(planBlocks)
    .where(eq(planBlocks.planId, planRow.id))
    .orderBy(planBlocks.start);
  return result.map(toBlock);
}
