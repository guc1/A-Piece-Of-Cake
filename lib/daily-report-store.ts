import { db } from './db';
import { dailyReports } from './db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';
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
      content: dailyReports.content,
      version: dailyReports.version,
    })
    .from(dailyReports)
    .where(eq(dailyReports.userId, userId))
    .orderBy(asc(dailyReports.date), asc(dailyReports.version));
  return rows.map((r) => {
    const ymd = r.date?.toString().slice(0, 10) ?? '';
    const parsed = parseReportContent(r.content);
    const version = r.version ?? 1;
    return {
      date: ymd,
      slug: slugFromDate(ymd, version),
      version,
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
): Promise<void> {
  const { score: _ignored, ...rest } = content as any;
  const raw = JSON.stringify(rest);
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
      content: raw,
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
      content: rest,
      error,
    });
    throw error;
  }
}
