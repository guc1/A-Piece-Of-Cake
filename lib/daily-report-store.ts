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

export async function listDailyReports(userId: number): Promise<
  Array<{
    date: string;
    slug: string;
    score: number;
    summary: string;
    good: string[];
    bad: string[];
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
    const parsed = (r.content as ReportContent) || {};
    return {
      date: ymd,
      slug: slugFromDate(ymd),
      score: r.score ?? 0,
      summary: parsed.summary ?? '',
      good: parsed.good ?? [],
      bad: parsed.bad ?? [],
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
    content: (row.content as ReportContent) ?? ({} as ReportContent),
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
  // Use a raw SQL upsert to guarantee the report is stored for the
  // caller-provided date. This avoids issues with parameter ordering when
  // the server and client have differing conceptions of "today" due to
  // overridden site time.
  await db.execute(sql`
    insert into daily_reports (user_id, date, content, score)
    values (${userId}, ${date}::date, ${JSON.stringify(content)}::jsonb, ${score})
    on conflict (user_id, date) do update
      set content = excluded.content,
          score = excluded.score,
          created_at = now();
  `);
}
