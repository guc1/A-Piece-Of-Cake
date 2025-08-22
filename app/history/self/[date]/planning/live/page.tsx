import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getPlanAt } from '@/lib/plans-store';
import { listIngredients } from '@/lib/ingredients-store';
import { getUserTimeZone, startOfDay, addDays, toYMD } from '@/lib/clock';
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
  const at = snapshot.createdAt ?? addDays(day, 1, tz);
  const plan = await getPlanAt(me.id, dateStr, at);
  const ingredients = await listIngredients(String(me.id), me.id, at);
  return (
    <section id={`hist-self-plan-live-${me.id}-${date}`}>
      <EditorClient
        userId={String(me.id)}
        date={dateStr}
        today={dateStr}
        tz={tz}
        initialPlan={plan}
        ingredients={ingredients}
      />
    </section>
  );
}
