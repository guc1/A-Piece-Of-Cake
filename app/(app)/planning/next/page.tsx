import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { getOrCreatePlan } from '@/lib/plans-store';
import TimeOverrideBadge from '@/components/time-override-badge';
import EditorClient from './client';
import { listIngredients } from '@/lib/ingredients-store';
import { listFlavors } from '@/lib/flavors-store';
import { listAllSubflavors } from '@/lib/subflavors-store';
import { getLatestHeadingReport } from '@/lib/heading-report-store';
import { listDailyReports } from '@/lib/daily-report-store';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { listMonthlyReports } from '@/lib/monthly-report-store';
import { listTodos } from '@/lib/todos-store';

export const revalidate = 0;

export default async function PlanningNextPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const cookieStore = await cookies();
  const params = searchParams ? await searchParams : undefined;
  const showDailyAim = params?.showDailyAim === '1';
  const info = resolvePlanDate('next', me, {
    cookies: cookieStore,
    searchParams: params,
  });
  if (info.clamped) {
    const minStr = toYMD(info.min, info.tz);
    redirect(`/planning/next?date=${minStr}`);
  }
  const dateStr = toYMD(info.date, info.tz);
  const todayStr = toYMD(info.today, info.tz);
  const [
    plan,
    ingredients,
    flavors,
    subflavors,
    heading,
    dailyReports,
    weeklyReports,
    monthlyReports,
    todos,
  ] = await Promise.all([
    getOrCreatePlan(me.id, dateStr),
    listIngredients(String(me.id), me.id),
    listFlavors(String(me.id)),
    listAllSubflavors(String(me.id)),
    getLatestHeadingReport(me.id),
    listDailyReports(me.id),
    listWeeklyReports(me.id),
    listMonthlyReports(me.id),
    listTodos(String(me.id), me.id),
  ]);
  const reportContext = {
    heading,
    daily: dailyReports
      .slice(0, 7)
      .map((r) => ({ date: r.date, bad: r.bad, observations: r.observations })),
    weekly: weeklyReports.slice(0, 2).map((r) => ({
      startDate: r.startDate,
      endDate: r.endDate,
      bad: r.bad,
      observations: r.observations,
    })),
    monthly: monthlyReports.slice(0, 2).map((r) => ({
      startDate: r.startDate,
      endDate: r.endDate,
      bad: r.bad,
      observations: r.observations,
    })),
  };
  const overrideLabel = info.override
    ? `${info.now.toLocaleString('en-US', { timeZone: info.tz })} (tz: ${info.tz})`
    : null;
  return (
    <>
      {overrideLabel && <TimeOverrideBadge label={overrideLabel} />}
      <EditorClient
        key={dateStr}
        userId={String(me.id)}
        date={dateStr}
        today={todayStr}
        tz={info.tz}
        initialPlan={plan}
        ingredients={ingredients}
        flavors={flavors}
        subflavors={subflavors}
        todos={todos}
        reportContext={reportContext}
        initialShowDailyAim={showDailyAim}
      />
    </>
  );
}
