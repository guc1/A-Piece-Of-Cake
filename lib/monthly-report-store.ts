import { db } from './db';
import { monthlyReports } from './db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { MonthlyReport, ReportContent } from '@/types/report';

function slugFromRange(start: string, end: string, version = 1): string {
  const [ys, ms, ds] = start.split('-');
  const [ye, me, de] = end.split('-');
  const base = `${ds}${ms}${ys}-${de}${me}${ye}`;
  return version > 1 ? `${base}V${version}` : base;
}

function parseSlug(slug: string): {
  start: string;
  end: string;
  version: number;
} {
  const match = /^(\d{2})(\d{2})(\d{4})-(\d{2})(\d{2})(\d{4})(?:V(\d+))?$/.exec(
    slug,
  );
  if (!match) return { start: '', end: '', version: 1 };
  const [, ds, ms, ys, de, me, ye, v] = match;
  return {
    start: `${ys}-${ms}-${ds}`,
    end: `${ye}-${me}-${de}`,
    version: v ? Number(v) : 1,
  };
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

export async function listMonthlyReports(userId: number): Promise<
  Array<{
    startDate: string;
    endDate: string;
    slug: string;
    version: number;
    score: number;
    coachTone: string;
    coachToneCustom: string;
    summary: string;
    good: string[];
    bad: string[];
    observations: string[];
  }>
> {
  const rows = await db
    .select({
      startDate: monthlyReports.startDate,
      endDate: monthlyReports.endDate,
      score: monthlyReports.score,
      summary: monthlyReports.summary,
      good: monthlyReports.good,
      bad: monthlyReports.bad,
      observations: monthlyReports.observations,
      version: monthlyReports.version,
      coachTone: monthlyReports.coachTone,
      coachToneCustom: monthlyReports.coachToneCustom,
    })
    .from(monthlyReports)
    .where(eq(monthlyReports.userId, userId))
    .orderBy(desc(monthlyReports.startDate), desc(monthlyReports.version));
  return rows.map((r) => {
    const start = r.startDate?.toString().slice(0, 10) ?? '';
    const end = r.endDate?.toString().slice(0, 10) ?? '';
    const version = r.version ?? 1;
    return {
      startDate: start,
      endDate: end,
      slug: slugFromRange(start, end, version),
      version,
      score: r.score ?? 0,
      coachTone: r.coachTone ?? 'tone_medium',
      coachToneCustom: String(r.coachToneCustom ?? ''),
      summary: r.summary ?? '',
      good: parseList(r.good),
      bad: parseList(r.bad),
      observations: parseList(r.observations),
    };
  });
}

export async function getMonthlyReport(
  userId: number,
  slug: string,
): Promise<MonthlyReport | null> {
  const { start, end, version } = parseSlug(slug);
  const [row] = await db
    .select()
    .from(monthlyReports)
    .where(
      and(
        eq(monthlyReports.userId, userId),
        eq(monthlyReports.startDate, start),
        eq(monthlyReports.version, version),
      ),
    );
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId ?? 0,
    startDate: start,
    endDate: row.endDate?.toString().slice(0, 10) ?? end,
    version: row.version ?? 1,
    summary: row.summary ?? '',
    good: parseList(row.good),
    bad: parseList(row.bad),
    observations: parseList(row.observations),
    score: row.score ?? 0,
    coachTone: row.coachTone ?? 'tone_medium',
    coachToneCustom: String(row.coachToneCustom ?? ''),
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function createMonthlyReport(
  userId: number,
  startDate: string,
  endDate: string,
  content: ReportContent,
  score: number,
  coachTone: string,
  coachToneCustom: string,
): Promise<void> {
  try {
    const [{ maxVersion }] = await db
      .select({
        maxVersion: sql<number>`coalesce(max(${monthlyReports.version}),0)`,
      })
      .from(monthlyReports)
      .where(
        and(
          eq(monthlyReports.userId, userId),
          eq(monthlyReports.startDate, startDate),
        ),
      );
    const nextVersion = (maxVersion ?? 0) + 1;
    await db.insert(monthlyReports).values({
      userId,
      startDate,
      endDate,
      summary: content.summary ?? '',
      good: JSON.stringify(content.good ?? []),
      bad: JSON.stringify(content.bad ?? []),
      observations: JSON.stringify(content.observations ?? []),
      coachTone,
      coachToneCustom,
      score,
      version: nextVersion,
    });
    console.log('createMonthlyReport inserted', {
      userId,
      startDate,
      endDate,
      version: nextVersion,
      score,
      coachTone,
      coachToneCustom,
    });
  } catch (error) {
    console.error('createMonthlyReport failed', {
      userId,
      startDate,
      endDate,
      score,
      coachTone,
      coachToneCustom,
      content,
      error,
    });
    throw error;
  }
}
