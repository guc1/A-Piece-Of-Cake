import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { getOrCreatePlan } from '@/lib/plans-store';
import { startOfDay, addDays } from '@/lib/clock';
import TimeOverrideBadge from '@/components/time-override-badge';
import EditorClient from './client';

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
  const info = resolvePlanDate('next', me, {
    cookies: cookieStore,
    searchParams: params,
  });
  let target = info.date;
  const qDate = params?.date;
  if (qDate && typeof qDate === 'string') {
    const parsed = startOfDay(new Date(qDate), info.tz);
    const min = addDays(info.today, 1, info.tz);
    if (parsed >= min) target = parsed;
  }
  const dateStr = toYMD(target, info.tz);
  const todayStr = toYMD(info.today, info.tz);
  const plan = await getOrCreatePlan(me.id, dateStr);
  const overrideLabel = info.override
    ? `${info.now.toLocaleString('en-US', { timeZone: info.tz })} (tz: ${info.tz})`
    : null;
  return (
    <>
      {overrideLabel && <TimeOverrideBadge label={overrideLabel} />}
      <EditorClient
        userId={String(me.id)}
        date={dateStr}
        today={todayStr}
        tz={info.tz}
        initialPlan={plan}
      />
    </>
  );
}
