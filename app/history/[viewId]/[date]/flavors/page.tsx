import { auth } from '@/lib/auth';
import { getUserByViewId, ensureUser } from '@/lib/users';
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
  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  return (
    <section id={`hist-flav-${owner.id}-${date}`}>
      <FlavorsClient
        userId={String(owner.id)}
        selfId={viewer ? String(viewer.id) : undefined}
        initialFlavors={snapshot.flavors as any}
        snapshotSubflavors={snapshot.subflavors as any}
      />
    </section>
  );
}
