import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
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

export async function MonthlyReportsHome({ userId }: { userId: number }) {
  const [reports, weekly, dailyDates] = await Promise.all([
    listMonthlyReports(userId),
    listWeeklyReports(userId),
    listDailyReportDates(userId),
  ]);
  const reportMap = new Map(reports.map((r) => [r.startDate.slice(0, 7), r]));
  const monthsSet = new Set<string>();
  for (const d of dailyDates) monthsSet.add(d.slice(0, 7));
  for (const w of weekly) monthsSet.add(w.startDate.slice(0, 7));
  for (const r of reports) monthsSet.add(r.startDate.slice(0, 7));
  const months = Array.from(monthsSet).sort();
  if (months.length === 0)
    return (
      <main className="p-6">
        <BackButton />
        <h1 className="mb-4 text-2xl font-bold">Monthly Reports</h1>
        <p>No monthly data yet.</p>
      </main>
    );

  const first = new Date(months[0] + '-01');
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevMonthStart = new Date(currentMonthStart);
  prevMonthStart.setUTCMonth(prevMonthStart.getUTCMonth() - 1);

  const list: Array<{ start: string; end: string; report?: (typeof reports)[number] }> = [];
  for (
    let d = new Date(first);
    d < currentMonthStart;
    d.setUTCMonth(d.getUTCMonth() + 1)
  ) {
    const start = d.toISOString().slice(0, 10);
    const endDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
    const end = endDate.toISOString().slice(0, 10);
    const key = start.slice(0, 7);
    list.push({ start, end, report: reportMap.get(key) });
  }

  const prevMonthIso = prevMonthStart.toISOString().slice(0, 10);
  const items: ReportOverviewItem[] = [];
  for (const m of list) {
    if (m.report) {
      const r = m.report;
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
    if (m.start >= prevMonthIso) continue;
    const slug = slugFromRange(m.start, m.end);
    items.push({
      type: 'missing',
      key: slug,
      title: `${m.start} – ${m.end}`,
      message: 'This month the user did not generate a monthly assessment.',
    } as ReportOverviewItem);
  }
  const slugs = items
    .filter((item) => item.type === 'report')
    .map((item) => (item as ReportOverviewReportItem).slug);
  const highlights = await listHighlightsForTargets(userId, 'monthly', slugs);
  return (
    <main className="p-6">
      <BackButton />
      <h1 className="mb-4 text-2xl font-bold">Monthly Reports</h1>
      <ReportOverviewClient
        userId={userId}
        reportType="monthly"
        idPrefix="m0nthlyrep"
        items={items}
        initialHighlights={highlights}
        highlightLink="highlights"
      />
    </main>
  );
}

export default async function MonthlyReportsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <MonthlyReportsHome userId={me.id} />;
}
