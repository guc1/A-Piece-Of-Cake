import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';

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
  return <pre className="whitespace-pre-wrap">{JSON.stringify(snapshot, null, 2)}</pre>;
}
