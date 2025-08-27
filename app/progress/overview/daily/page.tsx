import Link from 'next/link';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listDailyReports } from '@/lib/daily-report-store';

export default async function DailyReportsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  const reports = await listDailyReports(me.id);
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Daily Reports</h1>
      <ul className="space-y-4">
        {reports.map((r) => (
          <li key={r.date} className="rounded border p-4 hover:bg-orange-50">
            <div className="mb-2 flex justify-between">
              <Link href={`/progress/overview/daily/${r.date}`}>{r.date}</Link>
              <span className="font-semibold">Score: {r.score}</span>
            </div>
            {r.summary && (
              <p className="mb-2 whitespace-pre-wrap">{r.summary}</p>
            )}
            {r.good.length > 0 && (
              <div className="mb-2">
                <h2 className="font-semibold">Good</h2>
                <ul className="list-disc pl-4">
                  {r.good.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
            {r.bad.length > 0 && (
              <div>
                <h2 className="font-semibold">Bad</h2>
                <ul className="list-disc pl-4">
                  {r.bad.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
