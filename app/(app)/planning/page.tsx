import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import PlanningLanding from './client';
import { cookies } from 'next/headers';
import TimeOverrideBadge from '@/components/time-override-badge';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';

export default async function PlanningPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const cookieStore = await cookies();
  const params = searchParams ? await searchParams : undefined;
  const req = { cookies: cookieStore, searchParams: params };
  const liveInfo = resolvePlanDate('live', me, req);
  const nextInfo = resolvePlanDate('next', me, req);
  const liveLabel = liveInfo.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: liveInfo.tz,
  });
  const nextLabel = nextInfo.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: nextInfo.tz,
  });
  const todayStr = toYMD(liveInfo.today, liveInfo.tz);
  const overrideLabel = liveInfo.override
    ? `${liveInfo.now.toLocaleString('en-US', { timeZone: liveInfo.tz })} (tz: ${liveInfo.tz})`
    : null;
  return (
    <>
      {overrideLabel && <TimeOverrideBadge label={overrideLabel} />}
      <PlanningLanding
        userId={String(me.id)}
        tz={liveInfo.tz}
        today={todayStr}
        nextLabel={nextLabel}
        liveLabel={liveLabel}
        reviewLabel={liveLabel}
      />
    </>
  );
}
