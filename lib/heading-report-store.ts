import { db } from './db';
import { headingReports } from './db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { HeadingReport } from '@/types/report';

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

function parseList(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(String(raw));
    return Array.isArray(arr) ? arr.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

export async function listHeadingReports(userId: number): Promise<
  Array<{
    date: string;
    slug: string;
    version: number;
    scoreProgress: number;
    scoreProbability: number;
  }>
> {
  const rows = await db
    .select({
      date: headingReports.date,
      version: headingReports.version,
      scoreProgress: headingReports.scoreProgress,
      scoreProbability: headingReports.scoreProbability,
    })
    .from(headingReports)
    .where(eq(headingReports.userId, userId))
    .orderBy(desc(headingReports.date), desc(headingReports.version));
  return rows.map((r) => {
    const ymd = r.date?.toString().slice(0, 10) ?? '';
    const version = r.version ?? 1;
    return {
      date: ymd,
      slug: slugFromDate(ymd, version),
      version,
      scoreProgress: r.scoreProgress ?? 0,
      scoreProbability: r.scoreProbability ?? 0,
    };
  });
}

export async function getHeadingReport(
  userId: number,
  slug: string,
): Promise<HeadingReport | null> {
  const { date, version } = parseSlug(slug);
  const [row] = await db
    .select()
    .from(headingReports)
    .where(
      and(
        eq(headingReports.userId, userId),
        eq(headingReports.date, date),
        eq(headingReports.version, version),
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

export async function getLatestHeadingReport(
  userId: number,
): Promise<HeadingReport | null> {
  const [row] = await db
    .select()
    .from(headingReports)
    .where(eq(headingReports.userId, userId))
    .orderBy(desc(headingReports.date), desc(headingReports.version))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId ?? 0,
    date: row.date?.toString().slice(0, 10) ?? '',
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

export async function createHeadingReport(
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
        maxVersion: sql<number>`coalesce(max(${headingReports.version}),0)`,
      })
      .from(headingReports)
      .where(and(eq(headingReports.userId, userId), eq(headingReports.date, ymd)));
    const nextVersion = (maxVersion ?? 0) + 1;
    await db.insert(headingReports).values({
      userId,
      date: ymd,
      overview: content.overview ?? '',
      shortTerm: JSON.stringify(content.shortTerm ?? []),
      longTerm: JSON.stringify(content.longTerm ?? []),
      feedback: JSON.stringify(content.feedback ?? []),
      scoreProgress,
      scoreProbability,
      coachTone,
      version: nextVersion,
    });
    console.log('createHeadingReport inserted', {
      userId,
      date: ymd,
      version: nextVersion,
      scoreProgress,
      scoreProbability,
      coachTone,
    });
  } catch (error) {
    console.error('createHeadingReport failed', {
      userId,
      date: ymd,
      scoreProgress,
      scoreProbability,
      coachTone,
      content,
      error,
    });
    throw error;
  }
}
