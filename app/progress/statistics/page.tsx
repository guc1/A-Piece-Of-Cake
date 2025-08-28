import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listDailyReports } from '@/lib/daily-report-store';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { listMonthlyReports } from '@/lib/monthly-report-store';
import { listYearlyReports } from '@/lib/yearly-report-store';
import StatisticsClient from '@/components/progress/statistics-client';
import BackButton from '@/components/back-button';

export async function StatisticsHome({ userId }: { userId: number }) {
  const [dailyReports, weeklyReports, monthlyReports, yearlyReports] =
    await Promise.all([
      listDailyReports(userId),
      listWeeklyReports(userId),
      listMonthlyReports(userId),
      listYearlyReports(userId),
    ]);

  const daily = dailyReports.map((r) => ({ date: r.date, score: r.score }));
  const weekly = weeklyReports.map((r) => ({
    startDate: r.startDate,
    endDate: r.endDate,
    score: r.score,
  }));
  const monthly = monthlyReports.map((r) => ({
    startDate: r.startDate,
    endDate: r.endDate,
    score: r.score,
  }));
  const yearly = yearlyReports.map((r) => ({
    startDate: r.startDate,
    endDate: r.endDate,
    score: r.score,
  }));

  return (
    <main className="p-6">
      <BackButton />
      <h1 className="mb-4 text-2xl font-bold">Statistics</h1>
      <StatisticsClient
        daily={daily}
        weekly={weekly}
        monthly={monthly}
        yearly={yearly}
      />
    </main>
  );
}

export default async function StatisticsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <StatisticsHome userId={me.id} />;
}
