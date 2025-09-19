import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listYearlyReports } from '@/lib/yearly-report-store';
import { listMonthlyReports } from '@/lib/monthly-report-store';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { listDailyReportDates } from '@/lib/daily-report-store';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { getDifficultyLabel } from '@/lib/ai/difficulty';
import BackButton from '@/components/back-button';
import { listHighlightsForTargets } from '@/lib/report-highlights';
import type {
  ReportOverviewItem,
  ReportOverviewReportItem,
} from '@/types/report-overview';
import ReportOverviewClient from '@/components/progress/report-overview-client';

function slugFromRange(start: string, end: string): string {
  const [ys, ms, ds] = start.split('-');
  const [ye, me, de] = end.split('-');
  return `${ds}${ms}${ys}-${de}${me}${ye}`;
}

export async function YearlyReportsHome({
  userId,
  highlightLink,
}: {
  userId: number;
  highlightLink: string;
}) {
  const [reports, monthly, weekly, dailyDates] = await Promise.all([
    listYearlyReports(userId),
    listMonthlyReports(userId),
    listWeeklyReports(userId),
    listDailyReportDates(userId),
  ]);
  const reportMap = new Map(reports.map((r) => [r.startDate.slice(0, 4), r]));
  const yearsSet = new Set<string>();
  for (const m of monthly) yearsSet.add(m.startDate.slice(0, 4));
  for (const w of weekly) yearsSet.add(w.startDate.slice(0, 4));
  for (const d of dailyDates) yearsSet.add(d.slice(0, 4));
  for (const r of reports) yearsSet.add(r.startDate.slice(0, 4));
  const years = Array.from(yearsSet).sort();
  if (years.length === 0)
    return (
      <main className="p-6">
        <BackButton />
        <h1 className="mb-4 text-2xl font-bold">Yearly Reports</h1>
        <p>No yearly data yet.</p>
      </main>
    );

  const first = Number(years[0]);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const list: Array<{ start: string; end: string; report?: (typeof reports)[number] }> = [];
  for (let y = first; y < currentYear; y++) {
    const start = `${y}-01-01`;
    const end = `${y}-12-31`;
    list.push({ start, end, report: reportMap.get(String(y)) });
  }

  const items: ReportOverviewItem[] = [];
  for (const y of list) {
    if (y.report) {
      const r = y.report;
      items.push({
        type: 'report',
        key: r.slug,
        slug: r.slug,
        title: `${r.startDate} – ${r.endDate}`,
        version: r.version,
        summary: r.summary,
        good: r.good,
        bad: r.bad,
        observations: r.observations,
        toneName: getCoachTone(r.coachTone).name,
        score: r.score,
        difficultyLabel: getDifficultyLabel(r.score),
        linkHref: r.slug,
      } as ReportOverviewItem);
      continue;
    }
    const year = y.start.slice(0, 4);
    if (Number(year) === currentYear - 1 && now.getUTCMonth() === 0) continue;
    const slug = slugFromRange(y.start, y.end);
    items.push({
      type: 'missing',
      key: slug,
      title: `${y.start} – ${y.end}`,
      message: 'This year the user did not generate a yearly assessment.',
    } as ReportOverviewItem);
  }
  const slugs = items
    .filter((item) => item.type === 'report')
    .map((item) => (item as ReportOverviewReportItem).slug);
  const highlights = await listHighlightsForTargets(userId, 'yearly', slugs);
  return (
    <main className="p-6">
      <BackButton />
      <h1 className="mb-4 text-2xl font-bold">Yearly Reports</h1>
      <ReportOverviewClient
        userId={userId}
        reportType="yearly"
        idPrefix="y3arlyrep"
        items={items}
        initialHighlights={highlights}
        highlightLink={highlightLink}
      />
    </main>
  );
}

export default async function YearlyReportsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return (
    <YearlyReportsHome
      userId={me.id}
      highlightLink="/progress/overview/yearly/highlights"
    />
  );
}
