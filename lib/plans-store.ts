import { db } from './db';
import { plans, planBlocks, planRevisions } from './db/schema';
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

export async function getPlanAt(
  userId: number,
  date: string,
  at: Date,
): Promise<Plan> {
  const [rev] = await db
    .select()
    .from(planRevisions)
    .where(
      and(
        eq(planRevisions.userId, userId),
        eq(planRevisions.planDate, date),
        lte(planRevisions.snapshotAt, at),
      ),
    )
    .orderBy(desc(planRevisions.snapshotAt))
    .limit(1);
  if (rev) {
    return {
      id: '',
      userId: String(userId),
      date,
      blocks: ((rev.payload as any).blocks as PlanBlock[]) || [],
    };
  }
  // When no revision exists at or before the requested time, the user had not
  // planned this date yet. Returning the current plan would leak future edits
  // into historical snapshots, so instead return an empty plan to reflect the
  // absence of data at that moment in time.
  return { id: '', userId: String(userId), date, blocks: [] };
}

export async function savePlan(
  userId: string,
  date: string,
  blocks: PlanBlockInput[],
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
      // Generate a new ID for every insert to avoid collisions with blocks
      // from other dates. Client-provided IDs are only used for updates.
      const [row] = await db
        .insert(planBlocks)
        .values({
          id: crypto.randomUUID(),
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
  await db.insert(planRevisions).values({
    userId: Number(userId),
    planDate: date,
    payload: { blocks: results },
  });
  return {
    id: String(planRow.id),
    userId,
    date,
    blocks: results,
  };
}
