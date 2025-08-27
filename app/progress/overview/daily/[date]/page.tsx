import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getDailyReport } from '@/lib/daily-report-store';
import { redirect, notFound } from 'next/navigation';

export default async function DailyReportDetail({
  params,
}: {
  params: { date: string };
}) {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  const slug = params.date;
  const report = await getDailyReport(me.id, slug);
  if (!report) notFound();
  const { summary, good, bad, observations } = report;
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold" id={`d41lyrep-title-${slug}-${me.id}`}>
        Report for {report.date}
        {report.version > 1 && (
          <span className="ml-1">(v{report.version})</span>
        )}
      </h1>
      <p className="mb-4 font-semibold" id={`d41lyrep-score-${slug}-${me.id}`}>
        Score: {report.score}
      </p>
      <pre className="whitespace-pre-wrap" id={`d41lyrep-sum-${slug}-${me.id}`}>
        {summary}
      </pre>
      {good.length > 0 && (
        <div className="mt-4" id={`d41lyrep-good-${slug}-${me.id}`}>
          <h2 className="font-semibold">What went well</h2>
          <ul className="list-disc pl-4">
            {good.map((g: string, i: number) => (
              <li key={i} id={`d41lyrep-good-${i}-${slug}-${me.id}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
      {bad.length > 0 && (
        <div className="mt-4" id={`d41lyrep-bad-${slug}-${me.id}`}>
          <h2 className="font-semibold">What went bad</h2>
          <ul className="list-disc pl-4">
            {bad.map((g: string, i: number) => (
              <li key={i} id={`d41lyrep-bad-${i}-${slug}-${me.id}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
      {observations.length > 0 && (
        <div className="mt-4" id={`d41lyrep-obs-${slug}-${me.id}`}>
          <h2 className="font-semibold">Observations</h2>
          <ul className="list-disc pl-4">
            {observations.map((g: string, i: number) => (
              <li key={i} id={`d41lyrep-obs-${i}-${slug}-${me.id}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
