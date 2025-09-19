import { db } from './db';
import { reviewExtraTime } from './db/schema';
import { and, desc, eq, gt } from 'drizzle-orm';
import { addDays, getNow, startOfDay, toYMD } from './clock';

export type ReviewExtraTimeRecord = {
  id: number;
  userId: number;
  reason: string;
  frozenDate: string;
  activatedAt: string;
  expiresAt: string;
  active: boolean;
};

type ReviewExtraTimeRow = typeof reviewExtraTime.$inferSelect;

type ActivationInput = {
  userId: number;
  tz: string;
  reason: string;
};

function normalizeDateValue(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function mapRow(
  row: ReviewExtraTimeRow | undefined,
  now: Date,
): ReviewExtraTimeRecord | null {
  if (!row || !row.id || !row.userId) return null;
  const activatedAt = row.activatedAt
    ? new Date(row.activatedAt)
    : new Date();
  const expiresAt = row.expiresAt ? new Date(row.expiresAt) : new Date(0);
  const frozenDate = normalizeDateValue(row.frozenDate);
  return {
    id: row.id,
    userId: row.userId,
    reason: row.reason ?? '',
    frozenDate,
    activatedAt: activatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: expiresAt.getTime() > now.getTime(),
  };
}

export async function activateReviewExtraTime({
  userId,
  tz,
  reason,
}: ActivationInput): Promise<ReviewExtraTimeRecord> {
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new Error('Reason for extra time is required.');
  }
  if (trimmed.length > 2000) {
    throw new Error('Reason is too long.');
  }
  const { now } = getNow(tz);
  const today = startOfDay(now, tz);
  const noon = new Date(today.getTime() + 12 * 60 * 60 * 1000);
  const frozenDate =
    now.getTime() < noon.getTime() ? addDays(today, -1, tz) : today;
  const frozenDateYmd = toYMD(frozenDate, tz);
  const nextDayStart = addDays(frozenDate, 1, tz);
  const expiresAt = new Date(nextDayStart.getTime() + 12 * 60 * 60 * 1000);
  const [row] = await db
    .insert(reviewExtraTime)
    .values({
      userId,
      reason: trimmed,
      frozenDate: frozenDateYmd,
      activatedAt: now,
      expiresAt,
    })
    .returning();
  const mapped = mapRow(row, now);
  if (!mapped) {
    throw new Error('Failed to activate review extra time.');
  }
  return mapped;
}

export async function getActiveReviewExtraTime(
  userId: number,
): Promise<ReviewExtraTimeRecord | null> {
  const now = new Date();
  const [row] = await db
    .select()
    .from(reviewExtraTime)
    .where(and(eq(reviewExtraTime.userId, userId), gt(reviewExtraTime.expiresAt, now)))
    .orderBy(desc(reviewExtraTime.activatedAt))
    .limit(1);
  return mapRow(row, now);
}

export async function getReviewExtraTimeForDate(
  userId: number,
  frozenDate: string,
): Promise<ReviewExtraTimeRecord | null> {
  const now = new Date();
  const [row] = await db
    .select()
    .from(reviewExtraTime)
    .where(
      and(
        eq(reviewExtraTime.userId, userId),
        eq(reviewExtraTime.frozenDate, frozenDate),
      ),
    )
    .orderBy(desc(reviewExtraTime.activatedAt))
    .limit(1);
  return mapRow(row, now);
}
