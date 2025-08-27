import { db } from './db';
import { dailyReports } from './db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';
import type { DailyReport, ReportContent } from '@/types/report';

function slugFromDate(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${d}${m}${y}`;
}

function dateFromSlug(slug: string): string {
  if (slug.length !== 8) return slug;
  const d = slug.slice(0, 2);
  const m = slug.slice(2, 4);
  const y = slug.slice(4);
  return `${y}-${m}-${d}`;
}

export async function listDailyReportDates(userId: number): Promise<string[]> {
  const rows = await db
    .select({ date: dailyReports.date })
    .from(dailyReports)
    .where(eq(dailyReports.userId, userId));
  return rows.map((r) => r.date?.toString().slice(0, 10) ?? '');
}

function parseReportContent(raw: unknown): ReportContent {
  if (!raw) return {} as ReportContent;
  try {
    return JSON.parse(String(raw)) as ReportContent;
  } catch {
    return {} as ReportContent;
  }
}

export async function listDailyReports(userId: number): Promise<
  Array<{
    date: string;
    slug: string;
    score: number;
    summary: string;
    good: string[];
    bad: string[];
    observations: string[];
  }>
> {
  const rows = await db
    .select({
      date: dailyReports.date,
      score: dailyReports.score,
      content: dailyReports.content,
    })
    .from(dailyReports)
    .where(eq(dailyReports.userId, userId))
    .orderBy(asc(dailyReports.date));
  return rows.map((r) => {
    const ymd = r.date?.toString().slice(0, 10) ?? '';
    const parsed = parseReportContent(r.content);
    return {
      date: ymd,
      slug: slugFromDate(ymd),
      score: r.score ?? 0,
      summary: parsed.summary ?? '',
      good: parsed.good ?? [],
      bad: parsed.bad ?? [],
      observations: parsed.observations ?? [],
    };
  });
}

export async function getDailyReport(
  userId: number,
  slug: string,
): Promise<DailyReport | null> {
  const date = dateFromSlug(slug);
  const [row] = await db
    .select()
    .from(dailyReports)
    .where(and(eq(dailyReports.userId, userId), eq(dailyReports.date, date)));
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId ?? 0,
    date,
    content: parseReportContent(row.content),
    score: row.score ?? 0,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function createDailyReport(
  userId: number,
  date: string,
  content: Record<string, unknown>,
  score: number,
) {
  // Use Drizzle's query builder to perform an UPSERT. This avoids raw SQL
  // issues and ensures parameters are bound correctly regardless of the
  // environment's timezone or Postgres settings.
  const serialized = JSON.stringify(content);
  await db
    .insert(dailyReports)
    .values({ userId, date, content: serialized, score })
    .onConflictDoUpdate({
      target: [dailyReports.userId, dailyReports.date],
      set: {
        content: serialized,
        score,
        createdAt: sql`now()`,
      },
    });
}
