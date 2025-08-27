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
  const slug = params.date;
  return (
    <main className="p-6">
      <h1
        className="mb-4 text-2xl font-bold"
        id={`d41lyr3p-title-${slug}-${me.id}`}
      >
        Report for {report.date}
        {report.version > 1 && (
          <span className="ml-1">(v{report.version})</span>
        )}
      </h1>
      <p
        className="mb-4 font-semibold"
        id={parsed.score.id || `d41lyr3p-score-${slug}-${me.id}`}
      >
        Score: {parsed.score.value}
      </p>
      <pre
        id={parsed.summary.id || `d41lyr3p-sum-${slug}-${me.id}`}
        className="whitespace-pre-wrap"
      >
        {parsed.summary.text}
      </pre>
      {parsed.good.length > 0 && (
        <div className="mt-4" id={`d41lyr3p-good-${slug}-${me.id}`}>
          <h2 className="font-semibold">What went well</h2>
          <ul className="list-disc pl-4">
            {parsed.good.map((g, i) => (
              <li key={g.id || i} id={g.id}>
                {g.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {parsed.bad.length > 0 && (
        <div className="mt-4" id={`d41lyr3p-bad-${slug}-${me.id}`}>
          <h2 className="font-semibold">What went bad</h2>
          <ul className="list-disc pl-4">
            {parsed.bad.map((g, i) => (
              <li key={g.id || i} id={g.id}>
                {g.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {parsed.observations.length > 0 && (
        <div className="mt-4" id={`d41lyr3p-obs-${slug}-${me.id}`}>
          <h2 className="font-semibold">Observations</h2>
          <ul className="list-disc pl-4">
            {parsed.observations.map((g, i) => (
              <li key={g.id || i} id={g.id}>
                {g.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
