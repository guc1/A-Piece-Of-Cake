import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getPlanAt } from '@/lib/plans-store';
import { getUserTimeZone, startOfDay, addDays, toYMD } from '@/lib/clock';
import EditorClient from '@/app/(app)/planning/next/client';

export const revalidate = 0;

export default async function HistoryPlanningReview({
  params,
}: {
  params: Promise<{ viewId: string; date: string }>;
}) {
  const { viewId, date } = await params;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const snapshot = await getProfileSnapshot(owner.id, date);
  if (!snapshot) notFound();
  const tz = getUserTimeZone(owner);
  const day = startOfDay(new Date(date), tz);
  const dateStr = toYMD(day, tz);
  const at = addDays(day, 1, tz);
  const plan = await getPlanAt(owner.id, dateStr, at);
  return (
    <section id={`hist-plan-review-${owner.id}-${date}`}>
      <EditorClient
        userId={String(owner.id)}
        date={dateStr}
        today={dateStr}
        tz={tz}
        initialPlan={plan}
        review
      />
    </section>
  );
}
