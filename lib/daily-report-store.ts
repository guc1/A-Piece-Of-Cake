import { db } from './db';
import { dailyReports } from './db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { DailyReport, ReportContent } from '@/types/report';

function slugFromDate(ymd: string, version = 1): string {
  const [y, m, d] = ymd.split('-');
  const base = `${d}${m}${y}`;
  return version > 1 ? `${base}V${version}` : base;
}

function parseSlug(slug: string): { date: string; version: number } {
  const match = /^([0-9]{2})([0-9]{2})([0-9]{4})(?:V(\d+))?$/.exec(slug);
  if (!match) return { date: slug, version: 1 };
  const [, d, m, y, v] = match;
  return { date: `${y}-${m}-${d}`, version: v ? Number(v) : 1 };
}

export async function listDailyReportDates(userId: number): Promise<string[]> {
  const rows = await db
    .select({ date: dailyReports.date })
    .from(dailyReports)
    .where(eq(dailyReports.userId, userId));
  const set = new Set<string>();
  for (const r of rows) set.add(r.date?.toString().slice(0, 10) ?? '');
  return Array.from(set);
}

function parseList(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(String(raw));
    return Array.isArray(arr) ? arr.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

export async function listDailyReports(userId: number): Promise<
  Array<{
    date: string;
    slug: string;
    version: number;
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
      summary: dailyReports.summary,
      good: dailyReports.good,
      bad: dailyReports.bad,
      observations: dailyReports.observations,
      version: dailyReports.version,
    })
    .from(dailyReports)
    .where(eq(dailyReports.userId, userId))
    .orderBy(desc(dailyReports.date), desc(dailyReports.version));
  return rows.map((r) => {
    const ymd = r.date?.toString().slice(0, 10) ?? '';
    const version = r.version ?? 1;
    return {
      date: ymd,
      slug: slugFromDate(ymd, version),
      version,
      score: r.score ?? 0,
      summary: r.summary ?? '',
      good: parseList(r.good),
      bad: parseList(r.bad),
      observations: parseList(r.observations),
    };
  });
}

export async function getDailyReport(
  userId: number,
  slug: string,
): Promise<DailyReport | null> {
  const { date, version } = parseSlug(slug);
  const [row] = await db
    .select()
    .from(dailyReports)
    .where(
      and(
        eq(dailyReports.userId, userId),
        eq(dailyReports.date, date),
        eq(dailyReports.version, version),
      ),
    );
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId ?? 0,
    date,
    version: row.version ?? 1,
    summary: row.summary ?? '',
    good: parseList(row.good),
    bad: parseList(row.bad),
    observations: parseList(row.observations),
    score: row.score ?? 0,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function createDailyReport(
  userId: number,
  date: string,
  content: ReportContent,
  score: number,
): Promise<void> {
  const ymd = new Date(date).toISOString().slice(0, 10);
  try {
    const [{ maxVersion }] = await db
      .select({
        maxVersion: sql<number>`coalesce(max(${dailyReports.version}),0)`,
      })
      .from(dailyReports)
      .where(and(eq(dailyReports.userId, userId), eq(dailyReports.date, ymd)));
    const nextVersion = (maxVersion ?? 0) + 1;
    await db.insert(dailyReports).values({
      userId,
      date: ymd,
      summary: content.summary ?? '',
      good: JSON.stringify(content.good ?? []),
      bad: JSON.stringify(content.bad ?? []),
      observations: JSON.stringify(content.observations ?? []),
      score,
      version: nextVersion,
    });
    console.log('createDailyReport inserted', {
      userId,
      date: ymd,
      version: nextVersion,
      score,
    });
  } catch (error) {
    console.error('createDailyReport failed', {
      userId,
      date: ymd,
      score,
      content,
      error,
    });
    throw error;
  }
}
