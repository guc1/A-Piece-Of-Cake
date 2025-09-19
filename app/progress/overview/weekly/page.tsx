import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
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

export async function WeeklyReportsHome({
  userId,
  highlightLink,
}: {
  userId: number;
  highlightLink: string;
}) {
  const [reports, dates] = await Promise.all([
    listWeeklyReports(userId),
    listDailyReportDates(userId),
  ]);

  const reportMap = new Map(reports.map((r) => [r.startDate, r]));
  const allDates = [
    ...dates,
    ...reports.map((r) => r.startDate),
  ].filter(Boolean);

  if (allDates.length === 0)
    return (
      <main className="p-6">
        <BackButton />
        <h1 className="mb-4 text-2xl font-bold">Weekly Reports</h1>
        <p>No weekly data yet.</p>
      </main>
    );

  // Determine earliest Monday to start listing weeks
  allDates.sort();
  const first = new Date(allDates[0]);
  first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7));

  // Determine current week start and previous week start
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setUTCDate(
    currentWeekStart.getUTCDate() - ((currentWeekStart.getUTCDay() + 6) % 7),
  );
  const prevWeekStart = new Date(currentWeekStart);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);

  const weeks: Array<{
    start: string;
    end: string;
    report?: (typeof reports)[number];
  }> = [];

  for (let d = new Date(first); d < currentWeekStart; d.setUTCDate(d.getUTCDate() + 7)) {
    const start = d.toISOString().slice(0, 10);
    const endDate = new Date(d);
    endDate.setUTCDate(d.getUTCDate() + 6);
    const end = endDate.toISOString().slice(0, 10);
    weeks.push({ start, end, report: reportMap.get(start) });
  }

  const prevWeekIso = prevWeekStart.toISOString().slice(0, 10);
  const items: ReportOverviewItem[] = [];
  for (const w of weeks) {
    if (w.report) {
      const r = w.report;
      const toneName = getCoachTone(r.coachTone).name;
      const toneCustom =
        r.coachTone === 'tone_custom' ? r.coachToneCustom : '';
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
        toneName,
        coachToneCustom: toneCustom,
        score: r.score,
        difficultyLabel: getDifficultyLabel(r.score),
        linkHref: r.slug,
      } as ReportOverviewItem);
      continue;
    }
    if (w.start >= prevWeekIso) continue;
    const slug = slugFromRange(w.start, w.end);
    items.push({
      type: 'missing',
      key: slug,
      title: `${w.start} – ${w.end}`,
      message: 'This week the user did not generate a weekly assessment.',
    } as ReportOverviewItem);
  }
  const slugs = items
    .filter((item) => item.type === 'report')
    .map((item) => (item as ReportOverviewReportItem).slug);
  const highlights = await listHighlightsForTargets(userId, 'weekly', slugs);
  return (
    <main className="p-6">
      <BackButton />
      <h1 className="mb-4 text-2xl font-bold">Weekly Reports</h1>
      <ReportOverviewClient
        userId={userId}
        reportType="weekly"
        idPrefix="w33klyrep"
        items={items}
        initialHighlights={highlights}
        highlightLink={highlightLink}
      />
    </main>
  );
}

export default async function WeeklyReportsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return (
    <WeeklyReportsHome
      userId={me.id}
      highlightLink="/progress/overview/weekly/highlights"
    />
  );
}
