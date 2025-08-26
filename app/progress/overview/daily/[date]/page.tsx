import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getDailyReport } from '@/lib/daily-reports';

export default async function DailyReportPage({
  params,
}: {
  params: { date: string };
}) {
  const session = await auth();
  if (!session) return null;
  const me = await ensureUser(session);
  const report = await getDailyReport(me.id, params.date);
  if (!report) {
    return (
      <main className="p-6">
        <p>No report for this day.</p>
      </main>
    );
  }
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Report for {params.date}</h1>
      <p>Score: {report.score}</p>
      <div>
        <h2 className="font-semibold">What went well</h2>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify((report.report as any).good, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-semibold">What went bad</h2>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify((report.report as any).bad, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-semibold">Observations</h2>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify((report.report as any).observations, null, 2)}
        </pre>
      </div>
    </main>
  );
}
