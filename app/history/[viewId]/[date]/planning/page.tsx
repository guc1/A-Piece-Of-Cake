import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlanStrict } from '@/lib/plans-store';
import { getUserTimeZone } from '@/lib/clock';
import EditorClient from '@/app/(app)/planning/next/client';

export const revalidate = 0;

export default async function HistoryViewPlanningPage({
  params,
}: {
  params: Promise<{ viewId: string; date: string }>;
}) {
  const { viewId, date } = await params;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const tz = getUserTimeZone(owner as any);
  const plan = await getPlanStrict(owner.id, date);
  const todayStr = date;
  return (
    <section id={`hist-plan-${owner.id}-${date}`}>
      <EditorClient
        userId={String(owner.id)}
        date={date}
        today={todayStr}
        tz={tz}
        initialPlan={plan}
        review
      />
    </section>
  );
}
