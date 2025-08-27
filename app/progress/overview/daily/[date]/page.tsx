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
      <h1 className="mb-4 text-2xl font-bold">Report for {report.date}</h1>
      <p className="mb-4 font-semibold">Score: {report.score}</p>
      <pre className="whitespace-pre-wrap">{parsed.summary ?? ''}</pre>
      {parsed.good && (
        <div className="mt-4">
          <h2 className="font-semibold">What went well</h2>
          <ul className="list-disc pl-4">
            {parsed.good.map((g: string, i: number) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
      {parsed.bad && (
        <div className="mt-4">
          <h2 className="font-semibold">What went bad</h2>
          <ul className="list-disc pl-4">
            {parsed.bad.map((g: string, i: number) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
      {parsed.observations && (
        <div className="mt-4">
          <h2 className="font-semibold">Observations</h2>
          <ul className="list-disc pl-4">
            {parsed.observations.map((g: string, i: number) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
