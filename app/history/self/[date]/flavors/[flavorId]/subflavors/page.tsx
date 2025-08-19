import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound, redirect } from 'next/navigation';
import SubflavorsClient from '@/app/(app)/flavors/[flavorId]/subflavors/client';

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
  const subflavors = (snapshot.subflavors as any[]).filter(
    (s) => s.flavorId === flavorId,
  );
  return (
    <SubflavorsClient
      userId={String(me.id)}
      selfId={String(me.id)}
      flavorId={flavorId}
      initialSubflavors={subflavors as any}
      targetFlavorId={flavorId}
    />
  );
}

