import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import FlavorsClient from './client';
import { getUserByViewId, ensureUser } from '@/lib/users';
import { listPeople } from '@/lib/people-store';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';

export default async function FlavorsPage({
  params,
}: {
  params?: { viewId?: string };
}) {
  const session = await auth();
  if (!session) notFound();
  const viewer = await ensureUser(session);
  let owner = viewer;
  if (params?.viewId) {
    const user = await getUserByViewId(params.viewId);
    if (!user) notFound();
    owner = user;
  }
  const flavors = await listFlavors(String(owner.id));
  const people = owner.id === viewer.id ? await listPeople(owner.id) : undefined;
  const ctx = buildViewContext({
    ownerId: owner.id,
    viewerId: viewer.id,
    mode: owner.id === viewer.id ? 'owner' : 'viewer',
    viewId: owner.viewId,
  });
  return (
    <ViewContextProvider value={ctx}>
      <FlavorsClient
        userId={String(owner.id)}
        selfId={String(viewer.id)}
        initialFlavors={flavors}
        people={people}
      />
    </ViewContextProvider>
  );
}

export function FlavorsHome({
  userId,
  selfId,
  initialFlavors,
  people,
}: {
  userId: string;
  selfId?: string;
  initialFlavors: any[];
  people?: any;
}) {
  return (
    <FlavorsClient
      userId={userId}
      selfId={selfId}
      initialFlavors={initialFlavors as any}
      people={people as any}
    />
  );
}
