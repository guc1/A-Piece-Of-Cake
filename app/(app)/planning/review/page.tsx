import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { getPlanStrict } from '@/lib/plans-store';
import TimeOverrideBadge from '@/components/time-override-badge';
import EditorClient from '../next/client';

export const revalidate = 0;

export default async function PlanningReviewPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const cookieStore = await cookies();
  const info = resolvePlanDate('review', me, { cookies: cookieStore, searchParams });
  const dateStr = toYMD(info.date, info.tz);
  const todayStr = toYMD(info.today, info.tz);
  const plan = await getPlanStrict(me.id, dateStr);
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
        live
        review
      />
    </>
  );
}
