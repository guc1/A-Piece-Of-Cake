import { db } from './db';
import { overviewReports } from './db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { OverviewReport } from '@/types/report';

function slugFromDate(ymd: string, version = 1): string {
  const [y, m, d] = ymd.split('-');
  const base = `${d}${m}${y}`;
  return version > 1 ? `${base}V${version}` : base;
}

function parseSlug(slug: string): { date: string; version: number } {
  const match = /^(\d{2})(\d{2})(\d{4})(?:V(\d+))?$/.exec(slug);
  if (!match) return { date: slug, version: 1 };
  const [, d, m, y, v] = match;
  return { date: `${y}-${m}-${d}`, version: v ? Number(v) : 1 };
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

export async function listOverviewReports(
  userId: number,
): Promise<
  Array<{
    date: string;
    slug: string;
    version: number;
    coachTone: string;
    overview: string;
    shortTerm: string[];
    longTerm: string[];
    feedback: string[];
    scoreProgress: number;
    scoreProbability: number;
  }>
> {
  const rows = await db
    .select({
      date: overviewReports.date,
      version: overviewReports.version,
      coachTone: overviewReports.coachTone,
      overview: overviewReports.overview,
      shortTerm: overviewReports.shortTerm,
      longTerm: overviewReports.longTerm,
      feedback: overviewReports.feedback,
      scoreProgress: overviewReports.scoreProgress,
      scoreProbability: overviewReports.scoreProbability,
    })
    .from(overviewReports)
    .where(eq(overviewReports.userId, userId))
    .orderBy(desc(overviewReports.date), desc(overviewReports.version));

  return rows.map((r) => {
    const ymd = r.date?.toString().slice(0, 10) ?? '';
    const version = r.version ?? 1;
    return {
      date: ymd,
      slug: slugFromDate(ymd, version),
      version,
      coachTone: r.coachTone ?? 'tone_medium',
      overview: r.overview ?? '',
      shortTerm: parseList(r.shortTerm),
      longTerm: parseList(r.longTerm),
      feedback: parseList(r.feedback),
      scoreProgress: r.scoreProgress ?? 0,
      scoreProbability: r.scoreProbability ?? 0,
    };
  });
}

export async function getOverviewReport(
  userId: number,
  slug: string,
): Promise<OverviewReport | null> {
  const { date, version } = parseSlug(slug);
  const [row] = await db
    .select()
    .from(overviewReports)
    .where(
      and(
        eq(overviewReports.userId, userId),
        eq(overviewReports.date, date),
        eq(overviewReports.version, version),
      ),
    );
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId ?? 0,
    date,
    version: row.version ?? 1,
    overview: row.overview ?? '',
    shortTerm: parseList(row.shortTerm),
    longTerm: parseList(row.longTerm),
    feedback: parseList(row.feedback),
    scoreProgress: row.scoreProgress ?? 0,
    scoreProbability: row.scoreProbability ?? 0,
    coachTone: row.coachTone ?? 'tone_medium',
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function createOverviewReport(
  userId: number,
  date: string,
  content: {
    overview: string;
    shortTerm: string[];
    longTerm: string[];
    feedback: string[];
  },
  scoreProgress: number,
  scoreProbability: number,
  coachTone: string,
): Promise<void> {
  const ymd = new Date(date).toISOString().slice(0, 10);
  try {
    const [{ maxVersion }] = await db
      .select({
        maxVersion: sql<number>`coalesce(max(${overviewReports.version}),0)`,
      })
      .from(overviewReports)
      .where(
        and(eq(overviewReports.userId, userId), eq(overviewReports.date, ymd)),
      );
    const nextVersion = (maxVersion ?? 0) + 1;
    await db.insert(overviewReports).values({
      userId,
      date: ymd,
      overview: content.overview ?? '',
      shortTerm: JSON.stringify(content.shortTerm ?? []),
      longTerm: JSON.stringify(content.longTerm ?? []),
      feedback: JSON.stringify(content.feedback ?? []),
      coachTone,
      scoreProgress,
      scoreProbability,
      version: nextVersion,
    });
    console.log('createOverviewReport inserted', {
      userId,
      date: ymd,
      version: nextVersion,
      scoreProgress,
      scoreProbability,
      coachTone,
    });
  } catch (error) {
    console.error('createOverviewReport failed', {
      userId,
      date: ymd,
      content,
      scoreProgress,
      scoreProbability,
      coachTone,
      error,
    });
    throw error;
  }
}
