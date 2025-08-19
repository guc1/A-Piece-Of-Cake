import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlanStrict } from '@/lib/plans-store';
import { resolvePlanDate } from '@/lib/plan-date';
import { toYMD } from '@/lib/clock';
import EditorClient from '@/app/(app)/planning/next/client';

export const revalidate = 0;

export default async function ViewPlanningReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string }>;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const { tz, date } = resolvePlanDate('review', user, {
    searchParams: new URLSearchParams(searchParams as any),
  });
  const dateStr = toYMD(date, tz);
  const plan = await getPlanStrict(user.id, dateStr);
  return (
    <section id={`v13w-plan-${user.id}`}>
      <EditorClient
        userId={String(user.id)}
        date={dateStr}
        tz={tz}
        initialPlan={plan}
        live
        review
      />
    </section>
  );
}
