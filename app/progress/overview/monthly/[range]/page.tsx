import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getMonthlyReport } from '@/lib/monthly-report-store';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { getDifficultyLabel } from '@/lib/ai/difficulty';
import { redirect, notFound } from 'next/navigation';
import { listHighlightsForTargets } from '@/lib/report-highlights';
import ReportDetailClient from '@/components/progress/report-detail-client';

export async function MonthlyReportDetailView({
  userId,
  slug,
}: {
  userId: number;
  slug: string;
}) {
  const [report, highlights] = await Promise.all([
    getMonthlyReport(userId, slug),
    listHighlightsForTargets(userId, 'monthly', [slug]),
  ]);
  if (!report) notFound();
  const toneName = getCoachTone(report.coachTone).name;
  const difficulty = getDifficultyLabel(report.score);
  return (
    <ReportDetailClient
      idPrefix="m0nthlyrep"
      userId={userId}
      slug={slug}
      title={`${report.startDate} – ${report.endDate}`}
      titlePrefix="Report for"
      version={report.version}
      toneName={toneName}
      score={report.score}
      difficultyLabel={difficulty}
      summary={report.summary}
      good={report.good}
      bad={report.bad}
      observations={report.observations}
      highlights={highlights}
    />
  );
}

export default async function MonthlyReportDetail({
  params,
}: {
  params: { range: string };
}) {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <MonthlyReportDetailView userId={me.id} slug={params.range} />;
}
