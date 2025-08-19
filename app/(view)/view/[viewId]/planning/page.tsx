import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import PlanningLanding from '@/app/(app)/planning/client';
import { cookies } from 'next/headers';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import TimeOverrideBadge from '@/components/time-override-badge';

export default async function ViewPlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const cookieStore = await cookies();
  const paramsObj = searchParams ? await searchParams : undefined;
  const req = { cookies: cookieStore, searchParams: paramsObj };
  const liveInfo = resolvePlanDate('live', user, req);
  const nextInfo = resolvePlanDate('next', user, req);
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
    <section id={`v13w-plan-${user.id}`}>
      {overrideLabel && <TimeOverrideBadge label={overrideLabel} />}
      <PlanningLanding
        userId={String(user.id)}
        tz={liveInfo.tz}
        today={todayStr}
        nextLabel={nextLabel}
        liveLabel={liveLabel}
        reviewLabel={liveLabel}
      />
    </section>
  );
}
