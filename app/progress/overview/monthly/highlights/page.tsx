import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import BackButton from '@/components/back-button';
import { listReportHighlights } from '@/lib/report-highlights';
import { listMonthlyReports } from '@/lib/monthly-report-store';
import { HighlightEntriesList } from '@/components/progress/highlight-entries';

export async function MonthlyHighlightsSection({
  userId,
  basePath = '/progress/overview/monthly',
}: {
  userId: number;
  basePath?: string;
}) {
  const [highlights, reports] = await Promise.all([
    listReportHighlights(userId, 'monthly'),
    listMonthlyReports(userId),
  ]);
  const reportMap = new Map(reports.map((r) => [r.slug, r]));
  const normalizedBasePath = basePath.endsWith('/')
    ? basePath.slice(0, -1)
    : basePath;
  const entries = highlights.map((highlight) => {
    const report = reportMap.get(highlight.targetSlug);
    const title = report
      ? `${report.startDate} – ${report.endDate}${report.version > 1 ? ` (v${report.version})` : ''}`
      : `Month ${highlight.targetSlug}`;
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
      <h1 className="mb-4 text-2xl font-bold">Monthly Highlights</h1>
      <HighlightEntriesList
        entries={entries}
        emptyMessage="No monthly highlights yet. Capture the standout insights from each month to celebrate progress."
      />
    </main>
  );
}

export default async function MonthlyHighlightsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <MonthlyHighlightsSection userId={me.id} />;
}
