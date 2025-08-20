import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound, redirect } from 'next/navigation';
import { listFlavors } from '@/lib/flavors-store';
import AllSubflavorsClient from '@/app/(view)/view/[viewId]/subflavors/client';
import type { Flavor } from '@/types/flavor';

export default async function HistorySubflavorsPage({
  params,
}: {
  params: Promise<{ date: string; flavorId: string }>;
}) {
  const { date, flavorId } = await params;
  const session = await auth();
  if (!session) redirect('/');
  const me = await ensureUser(session);
  const snapshot = await getProfileSnapshot(me.id, date);
  if (!snapshot) notFound();
  const subflavors = (snapshot.data.subflavors as any[]).filter(
    (s) => s.flavorId === flavorId,
  );
  const flavor = (snapshot.data.flavors as any[]).find(
    (f) => f.id === flavorId,
  ) as Flavor | undefined;
  if (!flavor) notFound();
  const myFlavors = await listFlavors(String(me.id));
  return (
    <AllSubflavorsClient
      userId={String(me.id)}
      selfId={String(me.id)}
      groups={[{ flavor: flavor as any, subflavors: subflavors as any }]}
      targetFlavorId={flavorId}
      selfFlavors={myFlavors}
    />
  );
}
