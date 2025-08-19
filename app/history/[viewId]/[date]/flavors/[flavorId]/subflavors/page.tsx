import { getUserByViewId, ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { listFlavors } from '@/lib/flavors-store';
import AllSubflavorsClient from '@/app/(view)/view/[viewId]/subflavors/client';
import { auth } from '@/lib/auth';
import type { Flavor } from '@/types/flavor';

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
  const flavor = (snapshot.flavors as any[]).find((f) => f.id === flavorId) as
    | Flavor
    | undefined;
  if (!flavor) notFound();
  const viewerFlavors = viewer ? await listFlavors(String(viewer.id)) : [];
  return (
    <section id={`hist-subflav-${owner.id}-${flavorId}-${date}`}>
      <AllSubflavorsClient
        userId={String(owner.id)}
        selfId={viewer ? String(viewer.id) : undefined}
        groups={[{ flavor: flavor as any, subflavors: subflavors as any }]}
        targetFlavorId={sp?.to}
        selfFlavors={viewerFlavors}
      />
    </section>
  );
}

