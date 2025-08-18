import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import FlavorsClient from './client';
import { getUserByViewId, ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';

export default async function FlavorsPage({
  params,
  searchParams,
}: {
  params?: { viewId?: string };
  searchParams?: { uid?: string };
}) {
  const session = await auth();
  if (!session) redirect('/');
  const viewerId = Number((session.user as any)?.id);
  let ownerId = viewerId;
  if (params?.viewId) {
    const user = await getUserByViewId(params.viewId);
    if (!user) redirect('/');
    ownerId = user.id;
  } else {
    const me = await ensureUser(session);
    if (!searchParams?.uid || Number(searchParams.uid) !== me.id) {
      redirect(`/flavors?uid=${me.id}`);
    }
  }
  const flavors = ownerId ? await listFlavors(String(ownerId)) : [];
  return <FlavorsClient userId={String(ownerId)} initialFlavors={flavors} />;
}
