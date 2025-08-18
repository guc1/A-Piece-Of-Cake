import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import FlavorsClient from './client';
import { getUserByViewId, ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';

export default async function FlavorsPage({
  params,
}: {
  params?: { viewId?: string };
}) {
  const session = await auth();
  if (!session) redirect('/');
  const self = await ensureUser(session);
  let ownerId = self.id;
  if (params?.viewId) {
    const user = await getUserByViewId(params.viewId);
    if (!user) redirect('/');
    ownerId = user.id;
  }
  const flavors = await listFlavors(String(ownerId));
  return <FlavorsClient userId={String(ownerId)} initialFlavors={flavors} />;
}
