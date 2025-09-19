import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import BackButton from '@/components/back-button';
import { listReportHighlights } from '@/lib/report-highlights';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { HighlightEntriesList } from '@/components/progress/highlight-entries';

export async function WeeklyHighlightsSection({
  userId,
  basePath = '/progress/overview/weekly',
}: {
  userId: number;
  basePath?: string;
}) {
  const [highlights, reports] = await Promise.all([
    listReportHighlights(userId, 'weekly'),
    listWeeklyReports(userId),
  ]);
  const reportMap = new Map(reports.map((r) => [r.slug, r]));
  const normalizedBasePath = basePath.endsWith('/')
    ? basePath.slice(0, -1)
    : basePath;
  const entries = highlights.map((highlight) => {
    const report = reportMap.get(highlight.targetSlug);
    const title = report
      ? `${report.startDate} – ${report.endDate}${report.version > 1 ? ` (v${report.version})` : ''}`
      : `Week ${highlight.targetSlug}`;
    return {
      id: highlight.id,
      title,
      snippet: highlight.snippet,
      color: highlight.color,
      createdAt: highlight.createdAt,
      linkHref: `${normalizedBasePath}/${highlight.targetSlug}`,
    };
  });
  return (
    <main className="p-6">
      <BackButton />
      <h1 className="mb-4 text-2xl font-bold">Weekly Highlights</h1>
      <HighlightEntriesList
        entries={entries}
        emptyMessage="No weekly highlights captured yet. Highlight your biggest wins to revisit them later."
      />
    </main>
  );
}

export default async function WeeklyHighlightsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <WeeklyHighlightsSection userId={me.id} />;
}
