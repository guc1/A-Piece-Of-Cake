import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import BackButton from '@/components/back-button';
import { listReportHighlights } from '@/lib/report-highlights';
import { listYearlyReports } from '@/lib/yearly-report-store';
import { HighlightEntriesList } from '@/components/progress/highlight-entries';

export async function YearlyHighlightsSection({
  userId,
  basePath = '/progress/overview/yearly',
}: {
  userId: number;
  basePath?: string;
}) {
  const [highlights, reports] = await Promise.all([
    listReportHighlights(userId, 'yearly'),
    listYearlyReports(userId),
  ]);
  const reportMap = new Map(reports.map((r) => [r.slug, r]));
  const normalizedBasePath = basePath.endsWith('/')
    ? basePath.slice(0, -1)
    : basePath;
  const entries = highlights.map((highlight) => {
    const report = reportMap.get(highlight.targetSlug);
    const title = report
      ? `${report.startDate} – ${report.endDate}${report.version > 1 ? ` (v${report.version})` : ''}`
      : `Year ${highlight.targetSlug}`;
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
      <h1 className="mb-4 text-2xl font-bold">Yearly Highlights</h1>
      <HighlightEntriesList
        entries={entries}
        emptyMessage="No yearly highlights yet. Capture the defining milestones from each year to track long-term momentum."
      />
    </main>
  );
}

export default async function YearlyHighlightsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <YearlyHighlightsSection userId={me.id} />;
}
