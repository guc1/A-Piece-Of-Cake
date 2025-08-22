import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getPlanAt } from '@/lib/plans-store';
import { getUserTimeZone, startOfDay, addDays, toYMD } from '@/lib/clock';
import EditorClient from '@/app/(app)/planning/next/client';
import { listIngredients } from '@/lib/ingredients-store';

export const revalidate = 0;

export default async function HistorySelfPlanningNext({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { date } = await params;
  const query = searchParams ? await searchParams : undefined;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const snapshot = await getProfileSnapshot(me.id, date);
  if (!snapshot) notFound();
  const tz = getUserTimeZone(me);
  const day = startOfDay(new Date(date), tz);
  const base = addDays(day, 1, tz);
  let target = base;
  const raw = Array.isArray(query?.date) ? query?.date[0] : query?.date;
  if (raw) {
    const cand = startOfDay(new Date(raw), tz);
    if (cand.getTime() >= base.getTime()) target = cand;
  }
  const dateStr = toYMD(target, tz);
  const todayStr = toYMD(day, tz);
  const at = snapshot.createdAt ?? addDays(day, 1, tz);
  const plan = await getPlanAt(me.id, dateStr, at);
  const ingredients = await listIngredients(String(me.id), me.id, at);
  return (
    <section id={`hist-self-plan-next-${me.id}-${date}`}>
      <EditorClient
        key={dateStr}
        userId={String(me.id)}
        date={dateStr}
        today={todayStr}
        tz={tz}
        initialPlan={plan}
        ingredients={ingredients}
      />
    </section>
  );
}
