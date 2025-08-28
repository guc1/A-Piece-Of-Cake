import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLatestHeadingReport } from '@/lib/heading-report-store';
import { listDailyReports } from '@/lib/daily-report-store';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { listMonthlyReports } from '@/lib/monthly-report-store';

export async function GET() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [heading, daily, weekly, monthly] = await Promise.all([
    getLatestHeadingReport(userId),
    listDailyReports(userId),
    listWeeklyReports(userId),
    listMonthlyReports(userId),
  ]);

  const lines: string[] = [];

  if (heading?.feedback && heading.feedback.length > 0) {
    lines.push('Feedback from review page agent:');
    heading.feedback.forEach((f) => lines.push(`- ${f}`));
  }

  const dailyTwo = daily.slice(0, 2);
  if (dailyTwo.length > 0) {
    lines.push('Recent daily reports:');
    dailyTwo.forEach((r) => {
      const bad = r.bad.length > 0 ? r.bad.join('; ') : 'none';
      const obs = r.observations.length > 0 ? r.observations.join('; ') : 'none';
      lines.push(
        `- ${r.date}\n  What went bad: ${bad}\n  Observations: ${obs}`,
      );
    });
  }

  const weeklyTwo = weekly.slice(0, 2);
  if (weeklyTwo.length > 0) {
    lines.push('Recent weekly reports:');
    weeklyTwo.forEach((r) => {
      const bad = r.bad.length > 0 ? r.bad.join('; ') : 'none';
      const obs = r.observations.length > 0 ? r.observations.join('; ') : 'none';
      lines.push(
        `- ${r.startDate} to ${r.endDate}\n  What went bad: ${bad}\n  Observations: ${obs}`,
      );
    });
  }

  const monthlyTwo = monthly.slice(0, 2);
  if (monthlyTwo.length > 0) {
    lines.push('Recent monthly reports:');
    monthlyTwo.forEach((r) => {
      const bad = r.bad.length > 0 ? r.bad.join('; ') : 'none';
      const obs = r.observations.length > 0 ? r.observations.join('; ') : 'none';
      lines.push(
        `- ${r.startDate} to ${r.endDate}\n  What went bad: ${bad}\n  Observations: ${obs}`,
      );
    });
  }

  const context = lines.join('\n');
  return NextResponse.json({ context });
}
