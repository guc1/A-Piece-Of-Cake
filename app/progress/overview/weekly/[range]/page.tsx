import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getWeeklyReport } from '@/lib/weekly-report-store';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { getDifficultyLabel } from '@/lib/ai/difficulty';
import { redirect, notFound } from 'next/navigation';

export async function WeeklyReportDetailView({
  userId,
  slug,
}: {
  userId: number;
  slug: string;
}) {
  const report = await getWeeklyReport(userId, slug);
  if (!report) notFound();
  const { summary, good, bad, observations, coachTone } = report;
  return (
    <main className="p-6">
      <h1
        className="mb-4 text-2xl font-bold"
        id={`w33klyrep-title-${slug}-${userId}`}
      >
        Report for {report.startDate} – {report.endDate}
        {report.version > 1 && (
          <span className="ml-1">(v{report.version})</span>
        )}
      </h1>
      <p className="mb-4 font-semibold">
        <span id={`w33klyrep-tone-${slug}-${userId}`}>
          {getCoachTone(coachTone).name}
        </span>
        <span className="ml-2" id={`w33klyrep-score-${slug}-${userId}`}>
          Score: {report.score}
        </span>
        <span className="ml-2" id={`w33klyrep-diff-${slug}-${userId}`}>
          {getDifficultyLabel(report.score)}
        </span>
      </p>
      <pre
        className="whitespace-pre-wrap"
        id={`w33klyrep-sum-${slug}-${userId}`}
      >
        {summary}
      </pre>
      {good.length > 0 && (
        <div className="mt-4" id={`w33klyrep-good-${slug}-${userId}`}>
          <h2 className="font-semibold">What went well</h2>
          <ul className="list-disc pl-4">
            {good.map((g: string, i: number) => (
              <li key={i} id={`w33klyrep-good-${i}-${slug}-${userId}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
      {bad.length > 0 && (
        <div className="mt-4" id={`w33klyrep-bad-${slug}-${userId}`}>
          <h2 className="font-semibold">What went bad</h2>
          <ul className="list-disc pl-4">
            {bad.map((g: string, i: number) => (
              <li key={i} id={`w33klyrep-bad-${i}-${slug}-${userId}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
      {observations.length > 0 && (
        <div className="mt-4" id={`w33klyrep-obs-${slug}-${userId}`}>
          <h2 className="font-semibold">Observations</h2>
          <ul className="list-disc pl-4">
            {observations.map((g: string, i: number) => (
              <li key={i} id={`w33klyrep-obs-${i}-${slug}-${userId}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

export default async function WeeklyReportDetail({
  params,
}: {
  params: { range: string };
}) {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <WeeklyReportDetailView userId={me.id} slug={params.range} />;
}
