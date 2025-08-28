import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getDailyReport } from '@/lib/daily-report-store';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { redirect, notFound } from 'next/navigation';

export async function DailyReportDetailView({
  userId,
  slug,
}: {
  userId: number;
  slug: string;
}) {
  const report = await getDailyReport(userId, slug);
  if (!report) notFound();
  const { summary, good, bad, observations, coachTone } = report;
  return (
    <main className="p-6">
      <h1
        className="mb-4 text-2xl font-bold"
        id={`d41lyrep-title-${slug}-${userId}`}
      >
        Report for {report.date}
        {report.version > 1 && (
          <span className="ml-1">(v{report.version})</span>
        )}
      </h1>
      <p className="mb-4 font-semibold">
        <span id={`d41lyrep-tone-${slug}-${userId}`}>
          {getCoachTone(coachTone).name}
        </span>
        <span className="ml-2" id={`d41lyrep-score-${slug}-${userId}`}>
          Score: {report.score}
        </span>
      </p>
      <pre
        className="whitespace-pre-wrap"
        id={`d41lyrep-sum-${slug}-${userId}`}
      >
        {summary}
      </pre>
      {good.length > 0 && (
        <div className="mt-4" id={`d41lyrep-good-${slug}-${userId}`}>
          <h2 className="font-semibold">What went well</h2>
          <ul className="list-disc pl-4">
            {good.map((g: string, i: number) => (
              <li key={i} id={`d41lyrep-good-${i}-${slug}-${userId}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
      {bad.length > 0 && (
        <div className="mt-4" id={`d41lyrep-bad-${slug}-${userId}`}>
          <h2 className="font-semibold">What went bad</h2>
          <ul className="list-disc pl-4">
            {bad.map((g: string, i: number) => (
              <li key={i} id={`d41lyrep-bad-${i}-${slug}-${userId}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
      {observations.length > 0 && (
        <div className="mt-4" id={`d41lyrep-obs-${slug}-${userId}`}>
          <h2 className="font-semibold">Observations</h2>
          <ul className="list-disc pl-4">
            {observations.map((g: string, i: number) => (
              <li key={i} id={`d41lyrep-obs-${i}-${slug}-${userId}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
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
