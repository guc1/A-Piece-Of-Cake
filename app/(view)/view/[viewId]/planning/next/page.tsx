import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { getPlanStrict } from '@/lib/plans-store';
import TimeOverrideBadge from '@/components/time-override-badge';
import EditorClient from '@/app/(app)/planning/next/client';

export const revalidate = 0;

export default async function ViewPlanningNextPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string }>;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const cookieStore = await cookies();
  const info = resolvePlanDate('next', user, { cookies: cookieStore, searchParams });
  const dateStr = toYMD(info.date, info.tz);
  const todayStr = toYMD(info.today, info.tz);
  const plan = await getPlanStrict(user.id, dateStr);
  const overrideLabel = info.override
    ? `${info.now.toLocaleString('en-US', { timeZone: info.tz })} (tz: ${info.tz})`
    : null;
  return (
    <section id={`v13w-plan-${user.id}`}>
      {overrideLabel && <TimeOverrideBadge label={overrideLabel} />}
      <EditorClient
        userId={String(user.id)}
        date={dateStr}
        today={todayStr}
        tz={info.tz}
        initialPlan={plan}
      />
    </section>
  );
}
