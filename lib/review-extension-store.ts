import { db } from './db';
import { reviewExtensions } from './db/schema';
import { and, desc, eq, gt } from 'drizzle-orm';

export interface ReviewExtensionRecord {
  id: number;
  userId: number;
  targetDate: string;
  reason: string;
  expiresAt: string;
  createdAt: string;
}

function toDateOnly(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toIso(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  const asDate = new Date(value as any);
  if (!Number.isNaN(asDate.getTime())) return asDate.toISOString();
  return new Date(0).toISOString();
}

function mapRow(row: typeof reviewExtensions.$inferSelect): ReviewExtensionRecord {
  return {
    id: row.id,
    userId: row.userId ?? 0,
    targetDate: toDateOnly(row.targetDate),
    reason: row.reason ?? '',
    expiresAt: toIso(row.expiresAt),
    createdAt: toIso(row.createdAt),
  };
}

export async function upsertReviewExtension({
  userId,
  targetDate,
  reason,
  expiresAt,
}: {
  userId: number;
  targetDate: string;
  reason: string;
  expiresAt: Date;
}): Promise<ReviewExtensionRecord> {
  const values = {
    userId,
    targetDate,
    reason,
    expiresAt,
    createdAt: new Date(),
  } as typeof reviewExtensions.$inferInsert;
  const [row] = await db
    .insert(reviewExtensions)
    .values(values)
    .onConflictDoUpdate({
      target: [reviewExtensions.userId, reviewExtensions.targetDate],
      set: {
        reason: values.reason,
        expiresAt: values.expiresAt,
        createdAt: values.createdAt,
      },
    })
    .returning();
  return mapRow(row);
}

export async function getActiveReviewExtension(
  userId: number,
  now: Date,
): Promise<ReviewExtensionRecord | null> {
  const rows = await db
    .select()
    .from(reviewExtensions)
    .where(and(eq(reviewExtensions.userId, userId), gt(reviewExtensions.expiresAt, now)))
    .orderBy(desc(reviewExtensions.expiresAt))
    .limit(1);
  if (!rows.length) return null;
  return mapRow(rows[0]);
}

export async function getReviewExtensionForDate(
  userId: number,
  targetDate: string,
): Promise<ReviewExtensionRecord | null> {
  const rows = await db
    .select()
    .from(reviewExtensions)
    .where(
      and(
        eq(reviewExtensions.userId, userId),
        eq(reviewExtensions.targetDate, targetDate),
      ),
    )
    .orderBy(desc(reviewExtensions.createdAt))
    .limit(1);
  if (!rows.length) return null;
  return mapRow(rows[0]);
}
