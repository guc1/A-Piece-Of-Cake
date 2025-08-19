import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getUserTimeZone, startOfDay, addDays, toYMD } from '@/lib/clock';
import PlanningLanding from '@/app/(app)/planning/client';

export default async function HistorySelfPlanningLanding({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const snapshot = await getProfileSnapshot(me.id, date);
  if (!snapshot) notFound();
  const tz = getUserTimeZone(me);
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
    <section id={`hist-self-plan-landing-${me.id}-${date}`}>
      <PlanningLanding
        userId={String(me.id)}
        tz={tz}
        today={todayStr}
        nextLabel={nextLabel}
        liveLabel={liveLabel}
        reviewLabel={liveLabel}
      />
    </section>
  );
}
