import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listDailyReports } from '@/lib/daily-report-store';
import StatisticsClient from '@/components/progress/statistics-client';

export async function StatisticsHome({ userId }: { userId: number }) {
  const reports = await listDailyReports(userId);
  const daily = reports.map((r) => ({ date: r.date, score: r.score }));
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Statistics</h1>
      <StatisticsClient daily={daily} />
    </main>
  );
}

export default async function StatisticsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <StatisticsHome userId={me.id} />;
}
