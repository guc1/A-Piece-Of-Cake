import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import SubflavorsClient from '@/app/(app)/flavors/[flavorId]/subflavors/client';

export default async function HistoryViewSubflavorsPage({
  params,
}: {
  params: Promise<{ viewId: string; date: string; flavorId: string }>;
}) {
  const { viewId, date, flavorId } = await params;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const snapshot = await getProfileSnapshot(owner.id, date);
  if (!snapshot) notFound();
  const subflavors = (snapshot.subflavors as any[]).filter(
    (s) => s.flavorId === flavorId,
  );
  return (
    <section id={`hist-subflav-${owner.id}-${flavorId}-${date}`}>
      <SubflavorsClient
        userId={String(owner.id)}
        flavorId={flavorId}
        initialSubflavors={subflavors as any}
      />
    </section>
  );
}

