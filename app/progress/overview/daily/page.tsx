import Link from 'next/link';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { listDailyReports } from '@/lib/daily-reports';

export default async function DailyOverviewPage() {
  const session = await auth();
  if (!session) {
    return null;
  }
  const me = await ensureUser(session);
  const reports = await listDailyReports(me.id);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Daily Reports</h1>
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.date}>
            <Link
              href={`/progress/overview/daily/${r.date}`}
              className="text-orange-500 underline"
            >
              {r.date} - score {r.score}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
