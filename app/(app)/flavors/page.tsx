import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import FlavorsClient from './client';
import { getUserByViewId, ensureUser } from '@/lib/users';
import { listPeople } from '@/lib/people-store';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { getLatestHeadingReport } from '@/lib/heading-report-store';

export default async function FlavorsPage({
  params,
}: {
  params: Promise<{ viewId?: string }>;
}) {
  const { viewId } = await params;
  const session = await auth();
  if (!session) notFound();
  const viewer = await ensureUser(session);
  let owner = viewer;
  if (viewId) {
    const user = await getUserByViewId(viewId);
    if (!user) notFound();
    owner = user;
  }
  const [flavors, people, heading] = await Promise.all([
    listFlavors(String(owner.id)),
    owner.id === viewer.id ? listPeople(owner.id) : Promise.resolve(undefined),
    getLatestHeadingReport(owner.id),
  ]);
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
        headingReport={heading ?? undefined}
      />
    </ViewContextProvider>
  );
}
