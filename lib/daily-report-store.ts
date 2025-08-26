import { db } from './db';
import { dailyReports } from './db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { DailyReport } from '@/types/report';

export async function listDailyReportDates(userId: number): Promise<string[]> {
  const rows = await db
    .select({ date: dailyReports.date })
    .from(dailyReports)
    .where(eq(dailyReports.userId, userId));
  return rows.map((r) => r.date?.toString().slice(0, 10) ?? '');
}

export async function listDailyReports(
  userId: number,
): Promise<Array<{ date: string; score: number }>> {
  const rows = await db
    .select({ date: dailyReports.date, score: dailyReports.score })
    .from(dailyReports)
    .where(eq(dailyReports.userId, userId))
    .orderBy(asc(dailyReports.date));
  return rows.map((r) => ({
    date: r.date?.toString().slice(0, 10) ?? '',
    score: r.score ?? 0,
  }));
}

export async function getDailyReport(
  userId: number,
  date: string,
): Promise<DailyReport | null> {
  const [row] = await db
    .select()
    .from(dailyReports)
    .where(and(eq(dailyReports.userId, userId), eq(dailyReports.date, date)));
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId ?? 0,
    date: row.date?.toString().slice(0, 10) ?? date,
    content: row.content ?? '',
    score: row.score ?? 0,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function createDailyReport(
  userId: number,
  date: string,
  content: string,
  score: number,
) {
  await db
    .insert(dailyReports)
    .values({ userId, date, content, score })
    .onConflictDoNothing({ target: [dailyReports.userId, dailyReports.date] });
}
