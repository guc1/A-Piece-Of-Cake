import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getPlanStrict } from '@/lib/plans-store';
import { getUserTimeZone, toYMD } from '@/lib/clock';
import EditorClient from '@/app/(app)/planning/next/client';

export default async function HistorySelfPlanningPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const session = await auth();
  const me = await ensureUser(session!);
  const snapshot = await getProfileSnapshot(me.id, date);
  if (!snapshot) notFound();
  const plan = await getPlanStrict(me.id, date);
  const tz = getUserTimeZone(me);
  const todayStr = toYMD(new Date(), tz);
  return (
    <section id={`hist-plan-${me.id}-${date}`}>
      <EditorClient
        userId={String(me.id)}
        date={date}
        today={todayStr}
        tz={tz}
        initialPlan={plan}
      />
    </section>
  );
}
