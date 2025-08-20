import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getPlanAtSnapshot } from '@/lib/plans-store';
import { getUserTimeZone, startOfDay, toYMD } from '@/lib/clock';
import EditorClient from '@/app/(app)/planning/next/client';

export const revalidate = 0;

export default async function HistorySelfPlanningLive({
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
  const dateStr = toYMD(day, tz);
  const plan =
    (await getPlanAtSnapshot(me.id, date, dateStr)) ||
    { id: '', userId: String(me.id), date: dateStr, blocks: [] };
  return (
    <section id={`hist-self-plan-live-${me.id}-${date}`}>
      <EditorClient
        userId={String(me.id)}
        date={dateStr}
        today={dateStr}
        tz={tz}
        initialPlan={plan}
      />
    </section>
  );
}
