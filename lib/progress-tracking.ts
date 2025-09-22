import { db } from './db';
import { plans, planBlocks } from './db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { listFlavors } from './flavors-store';
import { listAllSubflavors } from './subflavors-store';
import { addDays, getNow, startOfDay, toYMD } from './clock';
import type { TrackingDataset, TrackingDailyRecord } from '@/types/tracking';

type BuildOptions = {
  ownerId: number;
  viewerId?: number | null;
  tz: string;
  maxDays?: number;
};

function minutesBetween(start: Date, end: Date) {
  const delta = end.getTime() - start.getTime();
  return delta > 0 ? delta / 60000 : 0;
}

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function addUnique(list: string[], id: string) {
  if (!list.includes(id)) list.push(id);
}

export async function buildTrackingDataset({
  ownerId,
  viewerId,
  tz,
  maxDays = 370,
}: BuildOptions): Promise<TrackingDataset> {
  const { now } = getNow(tz);
  const today = startOfDay(now, tz);
  const todayStr = toYMD(today, tz);
  const start = addDays(today, -(maxDays - 1), tz);
  const startStr = toYMD(start, tz);
  const flavorPromise =
    viewerId === undefined
      ? listFlavors(String(ownerId))
      : listFlavors(String(ownerId), viewerId);
  const subflavorPromise =
    viewerId === undefined
      ? listAllSubflavors(String(ownerId))
      : listAllSubflavors(String(ownerId), viewerId);
  const [flavors, subflavors, rows] = await Promise.all([
    flavorPromise,
    subflavorPromise,
    db
      .select({
        date: plans.date,
        start: planBlocks.start,
        end: planBlocks.end,
        flavorIds: planBlocks.flavorIds,
        subflavorIds: planBlocks.subflavorIds,
      })
      .from(planBlocks)
      .innerJoin(plans, eq(planBlocks.planId, plans.id))
      .where(
        and(
          eq(plans.userId, ownerId),
          gte(plans.date, startStr),
          lte(plans.date, todayStr),
        ),
      ),
  ]);
  const allowedFlavors = new Set(flavors.map((f) => f.id));
  const visibleSubflavors = subflavors.filter((sf) => allowedFlavors.has(sf.flavorId));
  const allowedSubflavors = new Set(visibleSubflavors.map((s) => s.id));
  const subById = new Map(visibleSubflavors.map((s) => [s.id, s]));
  const records: TrackingDailyRecord[] = [];
  const recordMap = new Map<string, TrackingDailyRecord>();
  for (let i = 0; i < maxDays; i++) {
    const current = addDays(start, i, tz);
    if (current.getTime() > today.getTime()) break;
    const date = toYMD(current, tz);
    const record: TrackingDailyRecord = {
      date,
      totalMinutes: 0,
      flavorMinutes: {},
      subflavorMinutes: {},
      doneFlavors: [],
      plannedFlavors: [],
      doneSubflavors: [],
      plannedSubflavors: [],
    };
    records.push(record);
    recordMap.set(date, record);
  }
  const nowMs = now.getTime();
  for (const row of rows) {
    const dateStr = toDateString(row.date);
    const record = recordMap.get(dateStr);
    if (!record) continue;
    const startAt = new Date(row.start);
    const endAt = new Date(row.end);
    const duration = minutesBetween(startAt, endAt);
    if (duration <= 0) continue;
    const directFlavors = Array.isArray(row.flavorIds)
      ? row.flavorIds.filter(
          (fid): fid is string => typeof fid === 'string' && allowedFlavors.has(fid),
        )
      : [];
    const directSubflavors = Array.isArray(row.subflavorIds)
      ? row.subflavorIds.filter(
          (sid): sid is string => typeof sid === 'string' && allowedSubflavors.has(sid),
        )
      : [];
    const parentsFromSub = directSubflavors
      .map((sid) => subById.get(sid)?.flavorId)
      .filter((fid): fid is string => !!fid && allowedFlavors.has(fid));
    const flavorSet = new Set<string>([...directFlavors, ...parentsFromSub]);
    if (flavorSet.size === 0 && directSubflavors.length === 0) continue;
    record.totalMinutes += duration;
    if (flavorSet.size > 0) {
      const share = duration / flavorSet.size;
      for (const fid of flavorSet) {
        record.flavorMinutes[fid] = (record.flavorMinutes[fid] ?? 0) + share;
      }
    }
    if (directSubflavors.length > 0) {
      const share = duration / directSubflavors.length;
      for (const sid of directSubflavors) {
        record.subflavorMinutes[sid] = (record.subflavorMinutes[sid] ?? 0) + share;
      }
    }
    if (dateStr < todayStr) {
      for (const fid of flavorSet) addUnique(record.doneFlavors, fid);
      for (const sid of directSubflavors) addUnique(record.doneSubflavors, sid);
    } else if (dateStr === todayStr) {
      if (startAt.getTime() <= nowMs) {
        for (const fid of flavorSet) addUnique(record.doneFlavors, fid);
        for (const sid of directSubflavors) addUnique(record.doneSubflavors, sid);
      } else {
        for (const fid of flavorSet) addUnique(record.plannedFlavors, fid);
        for (const sid of directSubflavors) addUnique(record.plannedSubflavors, sid);
      }
    }
  }
  for (const record of records) {
    if (record.plannedFlavors.length) {
      record.plannedFlavors = record.plannedFlavors.filter(
        (id) => !record.doneFlavors.includes(id),
      );
    }
    if (record.plannedSubflavors.length) {
      record.plannedSubflavors = record.plannedSubflavors.filter(
        (id) => !record.doneSubflavors.includes(id),
      );
    }
  }
  return {
    timezone: tz,
    today: todayStr,
    now: now.toISOString(),
    maxDays: records.length,
    flavors: flavors.map((f) => ({
      id: f.id,
      name: f.name,
      icon: f.icon,
      color: f.color,
      createdAt: f.createdAt,
      orderIndex: f.orderIndex,
    })),
    subflavors: visibleSubflavors.map((sf) => ({
      id: sf.id,
      flavorId: sf.flavorId,
      name: sf.name,
      icon: sf.icon,
      color: sf.color,
      createdAt: sf.createdAt,
      orderIndex: sf.orderIndex,
    })),
    records,
  };
}
