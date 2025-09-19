import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listDailyReports } from '@/lib/daily-report-store';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { getDifficultyLabel } from '@/lib/ai/difficulty';
import { listProfileSnapshotDates } from '@/lib/profile-snapshots';
import BackButton from '@/components/back-button';
import { listHighlightsForTargets } from '@/lib/report-highlights';
import type {
  ReportOverviewItem,
  ReportOverviewReportItem,
} from '@/types/report-overview';
import ReportOverviewClient from '@/components/progress/report-overview-client';

export async function DailyReportsHome({
  userId,
  highlightLink,
}: {
  userId: number;
  highlightLink: string;
}) {
  const [reports, snapshots] = await Promise.all([
    listDailyReports(userId),
    listProfileSnapshotDates(userId),
  ]);
  const reportMap = new Map<string, (typeof reports)[number]>();
  for (const r of reports) {
    if (!reportMap.has(r.date)) reportMap.set(r.date, r);
  }
  const allDates = Array.from(
    new Set([...snapshots, ...reports.map((r) => r.date)]),
  ).sort((a, b) => (a < b ? 1 : -1));
  const items: ReportOverviewItem[] = allDates.map((date) => {
    const report = reportMap.get(date);
    if (!report) {
      return {
        type: 'missing',
        key: date,
        title: date,
        message: 'This day the user did not generate a daily assessment.',
      } as ReportOverviewItem;
    }
    const tone = getCoachTone(report.coachTone).name;
    const toneCustom =
      report.coachTone === 'tone_custom' ? report.coachToneCustom : '';
    const difficulty = getDifficultyLabel(report.score);
    return {
      type: 'report',
      key: report.slug,
      slug: report.slug,
      title: report.date,
      version: report.version,
      summary: report.summary,
      good: report.good,
      bad: report.bad,
      observations: report.observations,
      toneName: tone,
      coachToneCustom: toneCustom,
      score: report.score,
      difficultyLabel: difficulty,
      linkHref: report.slug,
    } as ReportOverviewItem;
  });
  const slugs = items
    .filter((item) => item.type === 'report')
    .map((item) => (item as ReportOverviewReportItem).slug);
  const highlights = await listHighlightsForTargets(userId, 'daily', slugs);
  return (
    <main className="p-6">
      <BackButton />
      <h1 className="mb-4 text-2xl font-bold">Daily Reports</h1>
      <ReportOverviewClient
        userId={userId}
        reportType="daily"
        idPrefix="d41lyrep"
        items={items}
        initialHighlights={highlights}
        highlightLink={highlightLink}
      />
    </main>
  );
}

export default async function DailyReportsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return (
    <DailyReportsHome
      userId={me.id}
      highlightLink="/progress/overview/daily/highlights"
    />
  );
}
