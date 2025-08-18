import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { CakeHome } from '@/components/cake/cake-home';

export default async function ViewHistoryPage({
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
    <section id={`hist-cake-${owner.id}-${date}`}>
      <CakeHome ownerId={owner.id} />
    </section>
  );
}
