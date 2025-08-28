import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { listIngredients } from '@/lib/ingredients-store';
import IngredientsClient from './client';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { listPeople } from '@/lib/people-store';
import { getLatestHeadingReport } from '@/lib/heading-report-store';
import { listDailyReports } from '@/lib/daily-report-store';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { listMonthlyReports } from '@/lib/monthly-report-store';

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams?: Promise<{ at?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const at = params?.at ? new Date(params.at) : undefined;
  const [
    ingredients,
    people,
    heading,
    dailyReports,
    weeklyReports,
    monthlyReports,
  ] = await Promise.all([
    listIngredients(String(me.id), me.id, at),
    listPeople(me.id),
    getLatestHeadingReport(me.id),
    listDailyReports(me.id),
    listWeeklyReports(me.id),
    listMonthlyReports(me.id),
  ]);

  const reportContext = {
    headingFeedback: heading?.feedback ?? [],
    daily: dailyReports
      .slice(0, 2)
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
  const ctx = buildViewContext({
    ownerId: me.id,
    viewerId: me.id,
    mode: at ? 'historical' : 'owner',
    viewId: me.viewId,
    snapshotDate: params?.at,
  });
  return (
    <ViewContextProvider value={ctx}>
      <IngredientsClient
        userId={String(me.id)}
        selfId={String(me.id)}
        initialIngredients={ingredients}
        people={people}
        reportContext={reportContext}
      />
    </ViewContextProvider>
  );
}

export function IngredientsHome({
  userId,
  selfId,
  initialIngredients,
  people,
  reportContext,
}: {
  userId: string;
  selfId?: string;
  initialIngredients: any[];
  people?: any;
  reportContext?: any;
}) {
  return (
    <IngredientsClient
      userId={userId}
      selfId={selfId}
      initialIngredients={initialIngredients as any}
      people={people as any}
      reportContext={reportContext}
    />
  );
}
