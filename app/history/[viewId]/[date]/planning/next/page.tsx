import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getPlanAtSnapshot } from '@/lib/plans-store';
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
  const sp = searchParams ? await searchParams : undefined;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const snapshot = await getProfileSnapshot(owner.id, date);
  if (!snapshot) notFound();
  const tz = getUserTimeZone(owner);
  const day = startOfDay(new Date(date), tz);
  const min = addDays(day, 1, tz);
  let target = min;
  const qDate = sp?.date;
  if (qDate && typeof qDate === 'string') {
    const parsed = startOfDay(new Date(qDate), tz);
    if (parsed >= min) target = parsed;
  }
  const dateStr = toYMD(target, tz);
  const todayStr = toYMD(day, tz);
  const plan =
    (await getPlanAtSnapshot(owner.id, date, dateStr)) ||
    { id: '', userId: String(owner.id), date: dateStr, blocks: [] };
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
