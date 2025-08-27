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
  const report = await getDailyReport(me.id, params.date);
  if (!report) notFound();
  const parsed = report.content;
  return (
    <main className="p-6">
      <h1
        className="mb-4 text-2xl font-bold"
        id={`d41lyrep-title-${report.id}-${me.id}`}
      >
        Report for {report.date}
        {report.version > 1 && (
          <span className="ml-1">(v{report.version})</span>
        )}
      </h1>
      <p
        className="mb-4 font-semibold"
        id={`d41lyrep-score-${report.id}-${me.id}`}
      >
        Score: {report.score}
      </p>
      <pre
        className="whitespace-pre-wrap"
        id={`d41lyrep-sum-${report.id}-${me.id}`}
      >
        {parsed.summary ?? ''}
      </pre>
      {Array.isArray(parsed.good) && parsed.good.length > 0 && (
        <div className="mt-4" id={`d41lyrep-good-${report.id}-${me.id}`}>
          <h2 className="font-semibold">What went well</h2>
          <ul className="list-disc pl-4">
            {parsed.good.map((g: string, i: number) => (
              <li key={i} id={`d41lyrep-good-${i}-${report.id}-${me.id}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(parsed.bad) && parsed.bad.length > 0 && (
        <div className="mt-4" id={`d41lyrep-bad-${report.id}-${me.id}`}>
          <h2 className="font-semibold">What went bad</h2>
          <ul className="list-disc pl-4">
            {parsed.bad.map((g: string, i: number) => (
              <li key={i} id={`d41lyrep-bad-${i}-${report.id}-${me.id}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(parsed.observations) && parsed.observations.length > 0 && (
        <div className="mt-4" id={`d41lyrep-obs-${report.id}-${me.id}`}>
          <h2 className="font-semibold">Observations</h2>
          <ul className="list-disc pl-4">
            {parsed.observations.map((g: string, i: number) => (
              <li key={i} id={`d41lyrep-obs-${i}-${report.id}-${me.id}`}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
