import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { listFlavors } from '@/lib/flavors-store';
import FlavorsClient from '../../../flavors/client';

export default async function ViewFlavorsPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const flavors = await listFlavors(String(user.id));
  return (
    <section id={`v13w-flav-${user.id}`}>
      <FlavorsClient userId={String(user.id)} initialFlavors={flavors} />
    </section>
  );
}
