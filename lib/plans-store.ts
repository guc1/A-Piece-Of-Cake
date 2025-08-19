import { db } from './db';
import { plans, planBlocks } from './db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { Plan, PlanBlock, PlanBlockInput } from '@/types/plan';

function toPlanBlock(row: typeof planBlocks.$inferSelect): PlanBlock {
  return {
    id: row.id,
    planId: row.planId?.toString() ?? '',
    start: row.start.toISOString(),
    end: row.end.toISOString(),
    title: row.title ?? '',
    description: row.description ?? '',
    color: row.color ?? '#888888',
    good: row.good ?? '',
    bad: row.bad ?? '',
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function getPlan(
  userId: string,
  dateStr: string,
): Promise<Plan | null> {
  const dateKey = new Date(dateStr).toISOString().slice(0, 10);
  const [planRow] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, Number(userId)), eq(plans.date, dateKey)));
  if (!planRow) return null;
  const blockRows = await db
    .select()
    .from(planBlocks)
    .where(eq(planBlocks.planId, planRow.id));
  return {
    id: planRow.id.toString(),
    userId: userId,
    date: planRow.date,
    blocks: blockRows.map(toPlanBlock),
    vibe: (planRow as any).vibe ?? undefined,
  };
}

export async function savePlan(
  userId: string,
  dateStr: string,
  blocks: PlanBlockInput[],
  vibe?: string,
): Promise<Plan> {
  const dateKey = new Date(dateStr).toISOString().slice(0, 10);
  let [planRow] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, Number(userId)), eq(plans.date, dateKey)));
  if (!planRow) {
    const inserted = await db
      .insert(plans)
      .values({ userId: Number(userId), date: dateKey, vibe })
      .returning();
    planRow = inserted[0];
  } else if (vibe !== undefined) {
    const [updated] = await db
      .update(plans)
      .set({ vibe })
      .where(eq(plans.id, planRow.id))
      .returning();
    planRow = updated;
  }
  const existing = await db
    .select({ id: planBlocks.id })
    .from(planBlocks)
    .where(eq(planBlocks.planId, planRow.id));
  const existingIds = new Set(existing.map((b) => b.id));
  const incomingIds = new Set(
    blocks.filter((b) => b.id).map((b) => b.id as string),
  );
  // delete removed
  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length) {
    await db.delete(planBlocks).where(inArray(planBlocks.id, toDelete));
  }
  const now = new Date();
  const results: PlanBlock[] = [];
  for (const blk of blocks) {
    if (blk.id && existingIds.has(blk.id)) {
      const [row] = await db
        .update(planBlocks)
        .set({
          start: new Date(blk.start),
          end: new Date(blk.end),
          title: blk.title.slice(0, 60),
          description: blk.description.slice(0, 500),
          color: blk.color,
          good: blk.good,
          bad: blk.bad,
          updatedAt: now,
        })
        .where(eq(planBlocks.id, blk.id))
        .returning();
      results.push(toPlanBlock(row));
    } else {
      const id = blk.id ?? crypto.randomUUID();
      const [row] = await db
        .insert(planBlocks)
        .values({
          id,
          planId: planRow.id,
          start: new Date(blk.start),
          end: new Date(blk.end),
          title: blk.title.slice(0, 60),
          description: blk.description.slice(0, 500),
          color: blk.color,
          good: blk.good,
          bad: blk.bad,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      results.push(toPlanBlock(row));
    }
  }
  return {
    id: planRow.id.toString(),
    userId,
    date: planRow.date,
    blocks: results,
    vibe: (planRow as any).vibe ?? vibe,
  };
}
