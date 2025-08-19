import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getUserTimeZone, startOfDay, addDays, toYMD } from '@/lib/clock';
import PlanningLanding from '@/app/(app)/planning/client';

export default async function HistoryPlanningLanding({
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
  const next = addDays(day, 1, tz);
  const liveLabel = day.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: tz,
  });
  const nextLabel = next.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: tz,
  });
  const todayStr = toYMD(day, tz);
  return (
    <section id={`hist-plan-landing-${owner.id}-${date}`}>
      <PlanningLanding
        userId={String(owner.id)}
        tz={tz}
        today={todayStr}
        nextLabel={nextLabel}
        liveLabel={liveLabel}
        reviewLabel={liveLabel}
      />
    </section>
  );
}
