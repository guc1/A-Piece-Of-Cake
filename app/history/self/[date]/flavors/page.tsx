import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import FlavorsClient from '@/app/(app)/flavors/client';

export default async function HistoryFlavorsPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const session = await auth();
  const me = await ensureUser(session!);
  const snapshot = await getProfileSnapshot(me.id, date);
  if (!snapshot) notFound();
  return (
    <FlavorsClient
      userId={String(me.id)}
      selfId={String(me.id)}
      initialFlavors={snapshot.data.flavors as any}
    />
  );
}
