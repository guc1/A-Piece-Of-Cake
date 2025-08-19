import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getPlanStrict } from '@/lib/plans-store';
import { getUserTimeZone, startOfDay, addDays, toYMD } from '@/lib/clock';
import EditorClient from '@/app/(app)/planning/next/client';

export const revalidate = 0;

export default async function HistorySelfPlanningNext({
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
  const dateStr = toYMD(next, tz);
  const todayStr = toYMD(day, tz);
  const plan = await getPlanStrict(me.id, dateStr);
  return (
    <section id={`hist-self-plan-next-${me.id}-${date}`}>
      <EditorClient
        userId={String(me.id)}
        date={dateStr}
        today={todayStr}
        tz={tz}
        initialPlan={plan}
      />
    </section>
  );
}
