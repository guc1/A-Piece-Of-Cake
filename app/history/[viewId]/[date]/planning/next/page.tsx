import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getPlanAt } from '@/lib/plans-store';
import { getUserTimeZone, startOfDay, addDays, toYMD } from '@/lib/clock';
import EditorClient from '@/app/(app)/planning/next/client';

export const revalidate = 0;

export default async function HistoryPlanningNext({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string; date: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { viewId, date } = await params;
  const query = searchParams ? await searchParams : undefined;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const snapshot = await getProfileSnapshot(owner.id, date);
  if (!snapshot) notFound();
  const tz = getUserTimeZone(owner);
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
  const plan = await getPlanAt(owner.id, dateStr, snapshot.createdAt);
  return (
    <section id={`hist-plan-next-${owner.id}-${date}`}>
      <EditorClient
        userId={String(owner.id)}
        date={dateStr}
        today={todayStr}
        tz={tz}
        initialPlan={plan}
      />
    </section>
  );
}
