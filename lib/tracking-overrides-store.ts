import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from './db';
import { trackingOverrides } from './db/schema';
import type {
  TrackingOverride,
  TrackingOverrideState,
  TrackingOverrideTarget,
} from '@/types/tracking';

function normalizeDate(value: string): string {
  if (typeof value !== 'string') {
    throw new Error('Invalid date value');
  }
  const trimmed = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error('Invalid date format');
  }
  return trimmed;
}

function toOverride(
  row: typeof trackingOverrides.$inferSelect,
): TrackingOverride {
  const rawDate = row.date instanceof Date ? row.date : new Date(row.date ?? '');
  const date = Number.isNaN(rawDate.getTime())
    ? normalizeDate(String(row.date ?? ''))
    : rawDate.toISOString().slice(0, 10);
  return {
    date,
    targetType: row.targetType as TrackingOverrideTarget,
    targetId: row.targetId ?? '',
    state: row.state as TrackingOverrideState,
  };
}

export async function listTrackingOverrides(
  userId: number,
  start: string,
  end: string,
): Promise<TrackingOverride[]> {
  const startDate = normalizeDate(start);
  const endDate = normalizeDate(end);
  const [from, to] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
  const rows = await db
    .select()
    .from(trackingOverrides)
    .where(
      and(
        eq(trackingOverrides.userId, userId),
        gte(trackingOverrides.date, from),
        lte(trackingOverrides.date, to),
      ),
    );
  return rows.map(toOverride);
}

export async function saveTrackingOverride({
  userId,
  date,
  targetType,
  targetId,
  state,
}: {
  userId: number;
  date: string;
  targetType: TrackingOverrideTarget;
  targetId: string;
  state: TrackingOverrideState;
}): Promise<TrackingOverride> {
  const normalizedDate = normalizeDate(date);
  const normalizedTarget = targetId.trim();
  if (!normalizedTarget) {
    throw new Error('Target id is required');
  }
  const now = new Date();
  const [row] = await db
    .insert(trackingOverrides)
    .values({
      userId,
      date: normalizedDate,
      targetType,
      targetId: normalizedTarget,
      state,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        trackingOverrides.userId,
        trackingOverrides.targetType,
        trackingOverrides.targetId,
        trackingOverrides.date,
      ],
      set: {
        state,
        updatedAt: now,
      },
    })
    .returning();

  return toOverride(row);
}
