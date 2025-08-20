import { db } from './db';
import { plans, planBlocks, planSnapshots } from './db/schema';
import { eq, and, inArray, lte, desc } from 'drizzle-orm';
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

async function fetchPlan(userId: number, date: string): Promise<Plan | null> {
  const [planRow] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, userId), eq(plans.date, date)));
  if (!planRow) return null;
  const blockRows = await db
    .select()
    .from(planBlocks)
    .where(eq(planBlocks.planId, planRow.id));
  return {
    id: planRow.id.toString(),
    userId: String(userId),
    date: planRow.date,
    blocks: blockRows.map(toPlanBlock),
  };
}

export async function getOrCreatePlan(
  userId: number,
  date: string,
): Promise<Plan> {
  let plan = await fetchPlan(userId, date);
  if (!plan) {
    const [inserted] = await db
      .insert(plans)
      .values({ userId, date })
      .returning();
    plan = {
      id: inserted.id.toString(),
      userId: String(userId),
      date: inserted.date,
      blocks: [],
    };
  }
  return plan;
}

export async function getPlanStrict(
  userId: number,
  date: string,
): Promise<Plan> {
  const plan = await fetchPlan(userId, date);
  if (plan) return plan;
  return { id: '', userId: String(userId), date, blocks: [] };
}

export async function savePlan(
  userId: string,
  date: string,
  blocks: PlanBlockInput[],
  snapshotDate?: string,
): Promise<Plan> {
  let planRow = await fetchPlan(Number(userId), date);
  if (!planRow) {
    planRow = await getOrCreatePlan(Number(userId), date);
  }
  const existing = await db
    .select({ id: planBlocks.id })
    .from(planBlocks)
    .where(eq(planBlocks.planId, Number(planRow.id)));
  const existingIds = new Set(existing.map((b) => b.id));
  const incomingIds = new Set(
    blocks.filter((b) => b.id).map((b) => b.id as string),
  );
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
          planId: Number(planRow.id),
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
  const plan = {
    id: String(planRow.id),
    userId,
    date,
    blocks: results,
  };
  if (snapshotDate) {
    await db
      .insert(planSnapshots)
      .values({
        userId: Number(userId),
        snapshotDate,
        planDate: date,
        blocks: results as any,
      })
      .onConflictDoUpdate({
        target: [
          planSnapshots.userId,
          planSnapshots.snapshotDate,
          planSnapshots.planDate,
        ],
        set: { blocks: results as any },
      });
  }
  return plan;
}

export async function getPlanAtSnapshot(
  userId: number,
  snapshotDate: string,
  date: string,
): Promise<Plan | null> {
  const rows = await db
    .select()
    .from(planSnapshots)
    .where(
      and(
        eq(planSnapshots.userId, userId),
        eq(planSnapshots.planDate, date),
        lte(planSnapshots.snapshotDate, snapshotDate),
      ),
    )
    .orderBy(desc(planSnapshots.snapshotDate))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: '',
    userId: String(userId),
    date,
    blocks: row.blocks as any,
  };
}
