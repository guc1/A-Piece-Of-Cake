import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import PlanningLanding from './client';
import { resolvePlanDate } from '@/lib/plan-date';

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = searchParams;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const nextInfo = resolvePlanDate('next', me, {
    searchParams: new URLSearchParams(params as any),
  });
  const liveInfo = resolvePlanDate('live', me, {
    searchParams: new URLSearchParams(params as any),
  });
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
    <PlanningLanding
      userId={String(me.id)}
      labels={{
        next: `Planning for Next Day — ${tomorrowLabel}`,
        live: `Live Planning — ${todayLabel}`,
        review: `Review Today’s Planning — ${todayLabel}`,
      }}
    />
  );
}
