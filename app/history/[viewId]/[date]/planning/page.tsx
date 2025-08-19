import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getPlanStrict } from '@/lib/plans-store';
import { getUserTimeZone, toYMD } from '@/lib/clock';
import EditorClient from '@/app/(app)/planning/next/client';

export default async function HistoryPlanningPage({
  params,
}: {
  params: Promise<{ viewId: string; date: string }>;
}) {
  const { viewId, date } = await params;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const snapshot = await getProfileSnapshot(owner.id, date);
  if (!snapshot) notFound();
  const plan = await getPlanStrict(owner.id, date);
  const tz = getUserTimeZone(owner);
  const todayStr = toYMD(new Date(), tz);
  return (
    <section id={`hist-plan-${owner.id}-${date}`}>
      <EditorClient
        userId={String(owner.id)}
        date={date}
        today={todayStr}
        tz={tz}
        initialPlan={plan}
      />
    </section>
  );
}
