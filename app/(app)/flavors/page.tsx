import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import FlavorsClient from './client';
import { getUserByViewId, ensureUser } from '@/lib/users';
import { createFlavor, updateFlavor } from './actions';

export default async function FlavorsPage({
  params,
}: {
  params?: { viewId?: string };
}) {
  const session = await auth();
  if (!session) notFound();
  const viewerId = Number((session.user as any)?.id);
  let ownerId = viewerId;
  if (params?.viewId) {
    const user = await getUserByViewId(params.viewId);
    if (!user) notFound();
    ownerId = user.id;
  } else {
    const me = await ensureUser(session);
    ownerId = me.id;
  }
  const flavors = await listFlavors(String(ownerId));
  const editable = ownerId === viewerId;
  const createAction = createFlavor.bind(null, ownerId);
  const updateAction = updateFlavor.bind(null, ownerId);
  return (
    <FlavorsClient
      userId={String(ownerId)}
      initialFlavors={flavors}
      editable={editable}
      createAction={editable ? createAction : undefined}
      updateAction={editable ? updateAction : undefined}
    />
  );
}
