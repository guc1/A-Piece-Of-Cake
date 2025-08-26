import { db } from '@/lib/db';
import { dailyReports } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getDailyReport(userId: number, date: string) {
  const rows = await db
    .select()
    .from(dailyReports)
    .where(and(eq(dailyReports.userId, userId), eq(dailyReports.date, date)));
  return rows[0] ?? null;
}

export async function saveDailyReport(
  userId: number,
  date: string,
  score: number,
  report: any,
) {
  await db
    .insert(dailyReports)
    .values({ userId, date, score, report })
    .onConflictDoNothing();
}

export async function listDailyReports(userId: number) {
  const rows = await db
    .select({ date: dailyReports.date, score: dailyReports.score })
    .from(dailyReports)
    .where(eq(dailyReports.userId, userId))
    .orderBy(desc(dailyReports.date));
  return rows.map((r) => ({ date: String(r.date), score: r.score }));
}

export async function listDailyReportDates(userId: number) {
  const rows = await db
    .select({ date: dailyReports.date })
    .from(dailyReports)
    .where(eq(dailyReports.userId, userId));
  return rows.map((r) => String(r.date));
}
