import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import FlavorsClient from '@/app/(app)/flavors/client';

export default async function HistoryViewFlavorsPage({
  params,
}: {
  params: Promise<{ viewId: string; date: string }>;
}) {
  const { viewId, date } = await params;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const snapshot = await getProfileSnapshot(owner.id, date);
  if (!snapshot) notFound();
  return (
    <section id={`hist-flav-${owner.id}-${date}`}>
      <FlavorsClient
      userId={String(owner.id)}
      initialFlavors={snapshot.flavors as any}
    />
    </section>
  );
}

