import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { CakeHome } from '@/components/cake/cake-home';

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const session = await auth();
  const me = await ensureUser(session!);
  const snapshot = await getProfileSnapshot(me.id, date);
  if (!snapshot) notFound();
  return <CakeHome ownerId={me.id} />;
}
