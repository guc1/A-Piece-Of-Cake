import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getPlanAtSnapshot } from '@/lib/plans-store';
import { getUserTimeZone, startOfDay, toYMD } from '@/lib/clock';
import EditorClient from '@/app/(app)/planning/next/client';

export const revalidate = 0;

export default async function HistoryPlanningLive({
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
  const plan =
    (await getPlanAtSnapshot(owner.id, date, dateStr)) ||
    { id: '', userId: String(owner.id), date: dateStr, blocks: [] };
  return (
    <section id={`hist-plan-live-${owner.id}-${date}`}>
      <EditorClient
        userId={String(owner.id)}
        date={dateStr}
        today={dateStr}
        tz={tz}
        initialPlan={plan}
      />
    </section>
  );
}
