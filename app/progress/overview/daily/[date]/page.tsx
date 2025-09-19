import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getDailyReport } from '@/lib/daily-report-store';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { getDifficultyLabel } from '@/lib/ai/difficulty';
import { redirect, notFound } from 'next/navigation';
import { listHighlightsForTargets } from '@/lib/report-highlights';
import ReportDetailClient from '@/components/progress/report-detail-client';

export async function DailyReportDetailView({
  userId,
  slug,
}: {
  userId: number;
  slug: string;
}) {
  const [report, highlights] = await Promise.all([
    getDailyReport(userId, slug),
    listHighlightsForTargets(userId, 'daily', [slug]),
  ]);
  if (!report) notFound();
  const toneName = getCoachTone(report.coachTone).name;
  const difficulty = getDifficultyLabel(report.score);
  return (
    <ReportDetailClient
      idPrefix="d41lyrep"
      userId={userId}
      slug={slug}
      title={report.date}
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

export default async function DailyReportDetail({
  params,
}: {
  params: { date: string };
}) {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <DailyReportDetailView userId={me.id} slug={params.date} />;
}
