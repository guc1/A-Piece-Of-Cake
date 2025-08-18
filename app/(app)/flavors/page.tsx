import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import FlavorsClient from './client';
import { getUserByViewId } from '@/lib/users';

export default async function FlavorsPage({
  params,
}: {
  params?: { viewId?: string };
}) {
  const session = await auth();
  const viewerId = (session?.user as any)?.id || '';
  let ownerId = viewerId;
  if (params?.viewId) {
    const user = await getUserByViewId(params.viewId);
    ownerId = user ? String(user.id) : '';
  }
  const flavors = ownerId ? await listFlavors(ownerId) : [];
  return <FlavorsClient userId={ownerId} initialFlavors={flavors} />;
}
