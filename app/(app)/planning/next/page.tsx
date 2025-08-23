import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { getOrCreatePlan } from '@/lib/plans-store';
import TimeOverrideBadge from '@/components/time-override-badge';
import EditorClient from './client';
import { listIngredients } from '@/lib/ingredients-store';

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
  const plan = await getOrCreatePlan(me.id, dateStr);
  const ingredients = await listIngredients(String(me.id), me.id);
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
        initialShowDailyAim={showDailyAim}
      />
    </>
  );
}
