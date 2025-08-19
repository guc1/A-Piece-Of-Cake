import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlanStrict } from '@/lib/plans-store';
import { resolvePlanDate } from '@/lib/plan-date';
import { toYMD } from '@/lib/clock';
import EditorClient from '../next/client';

export const revalidate = 0;

export default async function PlanningReviewPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = searchParams;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const { tz, date } = resolvePlanDate('review', me, {
    searchParams: new URLSearchParams(params as any),
  });
  const dateStr = toYMD(date, tz);
  const plan = await getPlanStrict(me.id, dateStr);
  return (
    <EditorClient
      userId={String(me.id)}
      date={dateStr}
      tz={tz}
      initialPlan={plan}
      live
      review
    />
  );
}
