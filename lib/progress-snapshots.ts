import { db } from './db';
import { plans, planBlocks, progressSnapshots } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { startOfDay, addDays, toYMD } from './clock';
import { listFlavors } from './flavors-store';
import { listAllSubflavors } from './subflavors-store';

function minutesBetween(start: Date, end: Date) {
  const delta = end.getTime() - start.getTime();
  return delta > 0 ? delta / 60000 : 0;
}

export async function createProgressSnapshot(
  userId: number,
  snapshotDate: string,
) {
  const [flavors, subflavors] = await Promise.all([
    listFlavors(String(userId)),
    listAllSubflavors(String(userId)),
  ]);
  const allowedFlavors = new Set(flavors.map((f) => f.id));
  const allowedSubflavors = new Set(subflavors.map((s) => s.id));
  const subById = new Map(subflavors.map((s) => [s.id, s]));
  const rows = await db
    .select({
      start: planBlocks.start,
      end: planBlocks.end,
      flavorIds: planBlocks.flavorIds,
      subflavorIds: planBlocks.subflavorIds,
    })
    .from(planBlocks)
    .innerJoin(plans, eq(planBlocks.planId, plans.id))
    .where(and(eq(plans.userId, userId), eq(plans.date, snapshotDate)));
  const flavorMinutes: Record<string, number> = {};
  const subflavorMinutes: Record<string, number> = {};
  const doneFlavors = new Set<string>();
  const doneSubflavors = new Set<string>();
  let totalMinutes = 0;
  for (const row of rows) {
    const start = new Date(row.start);
    const end = new Date(row.end);
    const duration = minutesBetween(start, end);
    if (duration <= 0) continue;
    const directFlavors = Array.isArray(row.flavorIds)
      ? row.flavorIds.filter((id): id is string =>
          typeof id === 'string' && allowedFlavors.has(id),
        )
      : [];
    const directSubs = Array.isArray(row.subflavorIds)
      ? row.subflavorIds.filter((id): id is string =>
          typeof id === 'string' && allowedSubflavors.has(id),
        )
      : [];
    const parentsFromSub = directSubs
      .map((sid) => subById.get(sid)?.flavorId)
      .filter((fid): fid is string => !!fid && allowedFlavors.has(fid));
    const flavorSet = new Set<string>([...directFlavors, ...parentsFromSub]);
    if (flavorSet.size === 0 && directSubs.length === 0) continue;
    totalMinutes += duration;
    for (const fid of flavorSet) doneFlavors.add(fid);
    for (const sid of directSubs) doneSubflavors.add(sid);
    if (flavorSet.size > 0) {
      const share = duration / flavorSet.size;
      for (const fid of flavorSet) {
        flavorMinutes[fid] = (flavorMinutes[fid] ?? 0) + share;
      }
    }
    if (directSubs.length > 0) {
      const share = duration / directSubs.length;
      for (const sid of directSubs) {
        subflavorMinutes[sid] = (subflavorMinutes[sid] ?? 0) + share;
      }
    }
  }
  await db
    .insert(progressSnapshots)
    .values({
      userId,
      snapshotDate,
      data: {
        totalMinutes,
        flavorMinutes,
        subflavorMinutes,
        doneFlavorIds: Array.from(doneFlavors),
        doneSubflavorIds: Array.from(doneSubflavors),
      },
    })
    .onConflictDoNothing();
}

export async function ensureDailyProgressSnapshot(userId: number, tz: string) {
  const today = startOfDay(new Date(), tz);
  const yesterday = addDays(today, -1, tz);
  const yIso = toYMD(yesterday, tz);
  const existing = await db
    .select({ id: progressSnapshots.id })
    .from(progressSnapshots)
    .where(and(eq(progressSnapshots.userId, userId), eq(progressSnapshots.snapshotDate, yIso)))
    .limit(1);
  if (existing.length === 0) {
    await createProgressSnapshot(userId, yIso);
  }
}

export async function getProgressSnapshot(userId: number, snapshotDate: string) {
  const [row] = await db
    .select()
    .from(progressSnapshots)
    .where(and(eq(progressSnapshots.userId, userId), eq(progressSnapshots.snapshotDate, snapshotDate)));
  if (!row) return null;
  return { ...(row.data as any), createdAt: row.createdAt };
}
