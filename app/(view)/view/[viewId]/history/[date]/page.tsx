import { notFound } from 'next/navigation';
import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot, listSnapshotDates } from '@/lib/profile-snapshots';
import { CakeHome } from '@/components/cake/cake-home';

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ viewId: string; date: string }>;
}) {
  const { viewId, date } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const snapshot = await getProfileSnapshot(user.id, new Date(date));
  if (!snapshot) notFound();
  const dates = await listSnapshotDates(user.id);
  return (
    <section id={`v13w-hist-${user.id}-${date}`}>
      <CakeHome snapshotDates={dates} />
      <pre className="mt-4 overflow-auto text-xs">
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </section>
  );
}
