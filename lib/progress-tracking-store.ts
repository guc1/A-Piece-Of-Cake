import { db } from './db';
import { plans, planBlocks, progressSnapshots } from './db/schema';
import { and, asc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import type { Flavor } from '@/types/flavor';
import type { Subflavor } from '@/types/subflavor';
import { addDays, parseYMD, startOfDay, toYMD } from './clock';
import { getPlanAt } from './plans-store';
import { listFlavors } from './flavors-store';
import { listAllSubflavors } from './subflavors-store';

type BlockRecord = {
  start: string;
  end: string;
  flavorIds: string[];
  subflavorIds: string[];
};

export type SubflavorProgress = {
  subflavorId: string;
  minutes: number;
  done: boolean;
  planned: boolean;
};

export type FlavorProgress = {
  flavorId: string;
  minutes: number;
  done: boolean;
  planned: boolean;
  subflavors: SubflavorProgress[];
};

export type DailyProgressRecord = {
  date: string;
  flavors: FlavorProgress[];
};

export type StoredProgressSnapshot = DailyProgressRecord & {
  version: 1;
  timeZone: string;
};

function minutesBetween(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, (end - start) / 60000);
}

type FlavorState = {
  minutes: number;
  done: boolean;
  planned: boolean;
  subflavors: Map<string, { minutes: number; done: boolean; planned: boolean }>;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const VISIBILITIES = new Set(['private', 'friends', 'followers', 'public']);

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return fallback;
  return fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof value === 'bigint') return Number(value);
  return fallback;
}

const ISO_FALLBACK = new Date(0).toISOString();

function toIsoString(value: unknown, fallback = ISO_FALLBACK): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return fallback;
}

type VisibilityValue = Flavor['visibility'];

function toVisibilityValue(
  value: unknown,
  fallback: VisibilityValue,
): VisibilityValue {
  if (typeof value === 'string' && VISIBILITIES.has(value)) {
    return value as VisibilityValue;
  }
  return fallback;
}

function normalizeFlavorRow(row: any, ownerId: number): Flavor | null {
  if (!row) return null;
  const id = toStringValue(row.id ?? row.flavorId ?? row.uuid ?? '');
  if (!id) return null;
  const userId = toStringValue(row.userId ?? row.user_id ?? ownerId, String(ownerId));
  const createdAt = toIsoString(row.createdAt ?? row.created_at);
  const updatedAt = toIsoString(row.updatedAt ?? row.updated_at);
  return {
    id,
    userId,
    slug: toStringValue(row.slug ?? ''),
    name: toStringValue(row.name ?? ''),
    description: toStringValue(row.description ?? ''),
    color: toStringValue(row.color ?? '#888888'),
    icon: toStringValue(row.icon ?? '⭐'),
    importance: toNumberValue(row.importance ?? row.weight ?? 0, 0),
    targetMix: toNumberValue(row.targetMix ?? row.target_mix ?? 0, 0),
    visibility: toVisibilityValue(row.visibility, 'public'),
    orderIndex: toNumberValue(row.orderIndex ?? row.order_index ?? 0, 0),
    createdAt,
    updatedAt,
  };
}

function normalizeSubflavorRow(row: any, ownerId: number): Subflavor | null {
  if (!row) return null;
  const id = toStringValue(row.id ?? row.subflavorId ?? row.uuid ?? '');
  const flavorId = toStringValue(row.flavorId ?? row.flavor_id ?? '');
  if (!id || !flavorId) return null;
  const userId = toStringValue(row.userId ?? row.user_id ?? ownerId, String(ownerId));
  const createdAt = toIsoString(row.createdAt ?? row.created_at);
  const updatedAt = toIsoString(row.updatedAt ?? row.updated_at);
  return {
    id,
    userId,
    flavorId,
    slug: toStringValue(row.slug ?? ''),
    name: toStringValue(row.name ?? ''),
    description: toStringValue(row.description ?? ''),
    color: toStringValue(row.color ?? '#888888'),
    icon: toStringValue(row.icon ?? '⭐'),
    importance: toNumberValue(row.importance ?? row.weight ?? 0, 0),
    targetMix: toNumberValue(row.targetMix ?? row.target_mix ?? 0, 0),
    visibility: toVisibilityValue(row.visibility, 'private'),
    orderIndex: toNumberValue(row.orderIndex ?? row.order_index ?? 0, 0),
    createdAt,
    updatedAt,
  };
}

function sortFlavorsBySnapshot(list: Flavor[]): Flavor[] {
  return list.sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
    return (
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });
}

function sortSubflavorsBySnapshot(list: Subflavor[]): Subflavor[] {
  return list.sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
    return (
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });
}

export function normalizeSnapshotFlavors(
  source: unknown,
  ownerId: number,
): Flavor[] {
  if (!Array.isArray(source)) return [];
  const results: Flavor[] = [];
  for (const entry of source) {
    const normalized = normalizeFlavorRow(entry, ownerId);
    if (normalized) results.push(normalized);
  }
  return sortFlavorsBySnapshot(results);
}

export function normalizeSnapshotSubflavors(
  source: unknown,
  ownerId: number,
): Subflavor[] {
  if (!Array.isArray(source)) return [];
  const results: Subflavor[] = [];
  for (const entry of source) {
    const normalized = normalizeSubflavorRow(entry, ownerId);
    if (normalized) results.push(normalized);
  }
  return sortSubflavorsBySnapshot(results);
}

function buildDailyRecord({
  date,
  blocks,
  flavors,
  subflavors,
  at,
}: {
  date: string;
  blocks: BlockRecord[];
  flavors: Flavor[];
  subflavors: Subflavor[];
  at: Date;
}): DailyProgressRecord {
  const flavorStates = new Map<string, FlavorState>();
  const subToFlavor = new Map<string, string>();
  const subsByFlavor = new Map<string, Subflavor[]>();
  for (const flavor of flavors) {
    flavorStates.set(flavor.id, {
      minutes: 0,
      done: false,
      planned: false,
      subflavors: new Map(),
    });
  }
  for (const sub of subflavors) {
    subToFlavor.set(sub.id, sub.flavorId);
    if (!subsByFlavor.has(sub.flavorId)) subsByFlavor.set(sub.flavorId, []);
    subsByFlavor.get(sub.flavorId)!.push(sub);
    if (!flavorStates.has(sub.flavorId)) {
      flavorStates.set(sub.flavorId, {
        minutes: 0,
        done: false,
        planned: false,
        subflavors: new Map(),
      });
    }
    const parent = flavorStates.get(sub.flavorId)!;
    parent.subflavors.set(sub.id, { minutes: 0, done: false, planned: false });
  }

  const atTime = at.getTime();

  for (const block of blocks) {
    const minutes = minutesBetween(block.start, block.end);
    if (minutes === 0) continue;
    const start = new Date(block.start).getTime();
    const end = new Date(block.end).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    const done = end <= atTime;
    const planned = !done && start <= atTime;

    const validSubs = block.subflavorIds.filter((sid) => subToFlavor.has(sid));
    if (validSubs.length > 0) {
      const share = minutes / validSubs.length;
      for (const sid of validSubs) {
        const flavorId = subToFlavor.get(sid);
        if (!flavorId) continue;
        const parent = flavorStates.get(flavorId);
        if (!parent) continue;
        const subState = parent.subflavors.get(sid) ?? {
          minutes: 0,
          done: false,
          planned: false,
        };
        if (!parent.subflavors.has(sid)) parent.subflavors.set(sid, subState);
        if (done) {
          subState.minutes += share;
          subState.done = true;
          parent.minutes += share;
          parent.done = true;
        } else if (planned) {
          subState.planned = true;
          parent.planned = true;
        } else {
          parent.planned = true;
        }
      }
    }

    const directFlavors = block.flavorIds.filter((fid) => flavorStates.has(fid));
    const filteredDirect = directFlavors.filter((fid) =>
      !validSubs.some((sid) => subToFlavor.get(sid) === fid),
    );
    if (filteredDirect.length > 0) {
      const share = minutes / filteredDirect.length;
      for (const fid of filteredDirect) {
        const state = flavorStates.get(fid);
        if (!state) continue;
        if (done) {
          state.minutes += share;
          state.done = true;
        } else if (planned) {
          state.planned = true;
        } else {
          state.planned = true;
        }
      }
    }
  }

  const results: FlavorProgress[] = [];
  for (const flavor of flavors) {
    const state = flavorStates.get(flavor.id) ?? {
      minutes: 0,
      done: false,
      planned: false,
      subflavors: new Map<string, { minutes: number; done: boolean; planned: boolean }>(),
    };
    const subs = subsByFlavor.get(flavor.id) ?? [];
    const subEntries: SubflavorProgress[] = subs.map((sub) => {
      const subState = state.subflavors.get(sub.id) ?? {
        minutes: 0,
        done: false,
        planned: false,
      };
      return {
        subflavorId: sub.id,
        minutes: round2(subState.minutes),
        done: subState.done,
        planned: !subState.done && subState.planned,
      };
    });
    results.push({
      flavorId: flavor.id,
      minutes: round2(state.minutes),
      done: state.done,
      planned: !state.done && state.planned,
      subflavors: subEntries,
    });
  }

  return { date, flavors: results };
}

async function fetchPlanBlocksInRange(
  userId: number,
  startDate: string,
  endDate: string,
): Promise<Map<string, BlockRecord[]>> {
  const rows = await db
    .select({
      date: plans.date,
      start: planBlocks.start,
      end: planBlocks.end,
      flavorIds: planBlocks.flavorIds,
      subflavorIds: planBlocks.subflavorIds,
    })
    .from(plans)
    .leftJoin(planBlocks, eq(planBlocks.planId, plans.id))
    .where(
      and(
        eq(plans.userId, userId),
        gte(plans.date, startDate),
        lte(plans.date, endDate),
      ),
    )
    .orderBy(asc(plans.date), asc(planBlocks.start));

  const map = new Map<string, BlockRecord[]>();
  for (const row of rows) {
    if (!map.has(row.date)) map.set(row.date, []);
    if (row.start && row.end) {
      map.get(row.date)!.push({
        start: row.start.toISOString(),
        end: row.end.toISOString(),
        flavorIds: Array.isArray(row.flavorIds)
          ? row.flavorIds.map(String)
          : [],
        subflavorIds: Array.isArray(row.subflavorIds)
          ? row.subflavorIds.map(String)
          : [],
      });
    }
  }
  return map;
}

export async function createProgressSnapshot(
  userId: number,
  snapshotDate: string,
  tz: string,
) {
  const nextDay = addDays(parseYMD(snapshotDate, tz), 1, tz);
  const plan = await getPlanAt(userId, snapshotDate, nextDay);
  const allFlavors = await listFlavors(String(userId));
  const allSubflavors = await listAllSubflavors(String(userId));
  const record = buildDailyRecord({
    date: snapshotDate,
    blocks: plan.blocks.map((blk) => ({
      start: blk.start,
      end: blk.end,
      flavorIds: blk.flavorIds,
      subflavorIds: blk.subflavorIds,
    })),
    flavors: allFlavors,
    subflavors: allSubflavors,
    at: nextDay,
  });
  const payload: StoredProgressSnapshot = {
    version: 1,
    timeZone: tz,
    ...record,
  };
  await db
    .insert(progressSnapshots)
    .values({
      userId,
      snapshotDate,
      data: payload,
    })
    .onConflictDoUpdate({
      target: [progressSnapshots.userId, progressSnapshots.snapshotDate],
      set: { data: payload },
    });
}

export async function ensureDailyProgressSnapshot(userId: number, tz: string) {
  const today = startOfDay(new Date(), tz);
  const yesterday = addDays(today, -1, tz);
  const target = toYMD(yesterday, tz);
  const existing = await db
    .select({ id: progressSnapshots.id })
    .from(progressSnapshots)
    .where(and(eq(progressSnapshots.userId, userId), eq(progressSnapshots.snapshotDate, target)));
  if (existing.length === 0) {
    await createProgressSnapshot(userId, target, tz);
  }
}

export async function listProgressSnapshots(
  userId: number,
  opts: { startDate?: string; endDate?: string } = {},
): Promise<StoredProgressSnapshot[]> {
  const clauses: (SQL<unknown> | undefined)[] = [
    eq(progressSnapshots.userId, userId),
  ];
  if (opts.startDate) {
    clauses.push(gte(progressSnapshots.snapshotDate, opts.startDate));
  }
  if (opts.endDate) {
    clauses.push(lte(progressSnapshots.snapshotDate, opts.endDate));
  }
  const activeClauses = clauses.filter(Boolean) as SQL<unknown>[];
  const whereClause =
    activeClauses.length === 0
      ? undefined
      : activeClauses.length === 1
        ? activeClauses[0]
        : and(...activeClauses);
  const rows = await db
    .select({ data: progressSnapshots.data })
    .from(progressSnapshots)
    .where(whereClause)
    .orderBy(asc(progressSnapshots.snapshotDate));
  return rows
    .map((row) => row.data as StoredProgressSnapshot)
    .filter((snap) => snap && typeof snap === 'object');
}

export async function buildProgressTimeline({
  userId,
  tz,
  startDate,
  endDate,
  flavors,
  subflavors,
  now,
}: {
  userId: number;
  tz: string;
  startDate: string;
  endDate: string;
  flavors: Flavor[];
  subflavors: Subflavor[];
  now: Date;
}): Promise<DailyProgressRecord[]> {
  const snapshots = await listProgressSnapshots(userId, { startDate, endDate });
  const snapshotMap = new Map<string, StoredProgressSnapshot>();
  for (const snap of snapshots) snapshotMap.set(snap.date, snap);

  const planBlocks = await fetchPlanBlocksInRange(userId, startDate, endDate);

  const start = parseYMD(startDate, tz);
  const end = parseYMD(endDate, tz);
  const today = toYMD(startOfDay(now, tz), tz);
  const subsByFlavor = new Map<string, Subflavor[]>();
  for (const sub of subflavors) {
    if (!subsByFlavor.has(sub.flavorId)) subsByFlavor.set(sub.flavorId, []);
    subsByFlavor.get(sub.flavorId)!.push(sub);
  }
  const results: DailyProgressRecord[] = [];
  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1, tz)) {
    const date = toYMD(cursor, tz);
    const snap = snapshotMap.get(date);
    if (snap) {
      const flavorEntries: FlavorProgress[] = [];
      for (const flavor of flavors) {
        const original = snap.flavors.find((entry) => entry.flavorId === flavor.id);
        const subs = subsByFlavor.get(flavor.id) ?? [];
        const subEntries: SubflavorProgress[] = subs.map((sub) => {
          const origSub = original?.subflavors.find(
            (sf) => sf.subflavorId === sub.id,
          );
          return {
            subflavorId: sub.id,
            minutes: round2(origSub?.minutes ?? 0),
            done: origSub?.done ?? false,
            planned: origSub ? !origSub.done && origSub.planned : false,
          };
        });
        flavorEntries.push({
          flavorId: flavor.id,
          minutes: round2(original?.minutes ?? 0),
          done: original?.done ?? false,
          planned: original ? !original.done && original.planned : false,
          subflavors: subEntries,
        });
      }
      results.push({ date: snap.date, flavors: flavorEntries });
      continue;
    }
    const blocks = planBlocks.get(date) ?? [];
    const at = date < today ? addDays(parseYMD(date, tz), 1, tz) : now;
    results.push(
      buildDailyRecord({
        date,
        blocks,
        flavors,
        subflavors,
        at,
      }),
    );
  }
  return results;
}

export async function getTrackingStartDate(userId: number): Promise<string | null> {
  const [snapshotRow] = await db
    .select({ minDate: sql<string>`min(${progressSnapshots.snapshotDate})` })
    .from(progressSnapshots)
    .where(eq(progressSnapshots.userId, userId));
  const [planRow] = await db
    .select({ minDate: sql<string>`min(${plans.date})` })
    .from(plans)
    .innerJoin(planBlocks, eq(planBlocks.planId, plans.id))
    .where(eq(plans.userId, userId));
  const dates = [snapshotRow?.minDate, planRow?.minDate].filter(
    (d): d is string => !!d,
  );
  if (dates.length === 0) return null;
  return dates.sort()[0];
}
