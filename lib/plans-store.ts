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
  };
}

export async function savePlan(
  userId: string,
  dateStr: string,
  blocks: PlanBlockInput[],
): Promise<Plan> {
  const dateKey = new Date(dateStr).toISOString().slice(0, 10);
  let [planRow] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, Number(userId)), eq(plans.date, dateKey)));
  if (!planRow) {
    const inserted = await db
      .insert(plans)
      .values({ userId: Number(userId), date: dateKey })
      .returning();
    planRow = inserted[0];
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
  };
}

/**
 * When a new day starts, move any "plan for tomorrow" into today's plan
 * and clear the next-day plan so users can schedule afresh.
 */
export async function rolloverPlans(userId: string, now: Date): Promise<void> {
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  )
    .toISOString()
    .slice(0, 10);

  const todayPlan = await getPlan(userId, today);
  if (todayPlan) return; // already have today's plan

  const nextPlan = await getPlan(userId, tomorrow);
  if (!nextPlan) return;

  await savePlan(userId, today, nextPlan.blocks);
  await savePlan(userId, tomorrow, []);
}
