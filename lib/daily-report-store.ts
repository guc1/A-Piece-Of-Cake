import { db } from './db';
import { dailyReports } from './db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';
import type { DailyReport, ReportContent, ReportLine } from '@/types/report';

export function slugFromDate(ymd: string, version = 1): string {
  const [y, m, d] = ymd.split('-');
  const base = `${d}${m}${y}`;
  return version > 1 ? `${base}V${version}` : base;
}

export function parseSlug(slug: string): { date: string; version: number } {
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
  try {
    const parsed = JSON.parse(String(raw || '{}'));
    const wrap = (value: any, fallback = ''): ReportLine =>
      typeof value === 'object' && value !== null
        ? { id: String(value.id || ''), text: String(value.text || '') }
        : { id: '', text: String(value || fallback) };
    const arr = (value: any[]): ReportLine[] =>
      Array.isArray(value) ? value.map((v) => wrap(v)) : [];
    return {
      summary: wrap(parsed.summary),
      good: arr(parsed.good),
      bad: arr(parsed.bad),
      observations: arr(parsed.observations),
      score:
        typeof parsed.score === 'object'
          ? {
              id: String(parsed.score.id || ''),
              value: Number(parsed.score.value || 0),
            }
          : { id: '', value: Number(parsed.score || 0) },
    };
  } catch {
    return {
      summary: { id: '', text: '' },
      good: [],
      bad: [],
      observations: [],
      score: { id: '', value: 0 },
    };
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
      score: parsed.score.value ?? r.score ?? 0,
      summary: parsed.summary.text,
      good: parsed.good.map((g) => g.text),
      bad: parsed.bad.map((b) => b.text),
      observations: parsed.observations.map((o) => o.text),
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

export async function getNextDailyReportVersion(
  userId: number,
  date: string,
): Promise<number> {
  const [{ maxVersion }] = await db
    .select({
      maxVersion: sql<number>`coalesce(max(${dailyReports.version}),0)`,
    })
    .from(dailyReports)
    .where(and(eq(dailyReports.userId, userId), eq(dailyReports.date, date)));
  return (maxVersion ?? 0) + 1;
}

export async function createDailyReport(
  userId: number,
  date: string,
  content: Record<string, unknown>,
  score: number,
  version: number,
) {
  const raw = JSON.stringify(content);
  await db.insert(dailyReports).values({
    userId,
    date,
    content: raw,
    score,
    version,
  });
}
