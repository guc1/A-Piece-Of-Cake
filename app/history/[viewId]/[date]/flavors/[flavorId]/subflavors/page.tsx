import { getUserByViewId, ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import SubflavorsClient from '@/app/(app)/flavors/[flavorId]/subflavors/client';
import { auth } from '@/lib/auth';

export default async function HistoryViewSubflavorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string; date: string; flavorId: string }>;
  searchParams?: Promise<{ to?: string }>;
}) {
  const { viewId, date, flavorId } = await params;
  const sp = await searchParams;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  const snapshot = await getProfileSnapshot(owner.id, date);
  if (!snapshot) notFound();
  const subflavors = (snapshot.subflavors as any[]).filter(
    (s) => s.flavorId === flavorId,
  );
  return (
    <section id={`hist-subflav-${owner.id}-${flavorId}-${date}`}>
      <SubflavorsClient
        userId={String(owner.id)}
        selfId={viewer ? String(viewer.id) : undefined}
        flavorId={flavorId}
        initialSubflavors={subflavors as any}
        targetFlavorId={sp?.to}
      />
    </section>
  );
}

