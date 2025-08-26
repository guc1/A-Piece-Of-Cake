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
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.date}>
            <Link
              href={`/progress/overview/daily/${r.date}`}
              className="flex justify-between rounded border p-4 hover:bg-orange-50"
            >
              <span>{r.date}</span>
              <span>{r.score}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
