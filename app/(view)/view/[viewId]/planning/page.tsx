import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import PlanningLanding from '@/app/(app)/planning/client';
import { resolvePlanDate } from '@/lib/plan-date';

export default async function ViewPlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string }>;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const sp = new URLSearchParams(searchParams as any);
  const nextInfo = resolvePlanDate('next', user, { searchParams: sp });
  const liveInfo = resolvePlanDate('live', user, { searchParams: sp });
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: liveInfo.tz,
  });
  const todayLabel = formatter.format(liveInfo.date);
  const tomorrowLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: nextInfo.tz,
  }).format(nextInfo.date);
  return (
    <section id={`v13w-plan-${user.id}`}>
      <PlanningLanding
        userId={String(user.id)}
        labels={{
          next: `Planning for Next Day — ${tomorrowLabel}`,
          live: `Live Planning — ${todayLabel}`,
          review: `Review Today’s Planning — ${todayLabel}`,
        }}
      />
    </section>
  );
}
