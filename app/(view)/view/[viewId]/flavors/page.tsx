import { getUserByViewId, ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { FlavorsHome } from '@/app/(app)/flavors/page';

export default async function ViewFlavorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string }>;
  searchParams?: Promise<{ at?: string }>;
}) {
  const { viewId } = await params;
  const sp = await searchParams;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  const viewerId = viewer ? viewer.id : null;
  const flavors = await listFlavors(String(user.id));
  const ctx = buildViewContext({
    ownerId: user.id,
    viewerId: viewerId ?? null,
    mode: sp?.at ? 'historical' : 'viewer',
    viewId: user.viewId,
    snapshotDate: sp?.at,
  });
  return (
    <ViewContextProvider value={ctx}>
      <section id={`v13w-flav-${user.id}`}>
        <FlavorsHome
          userId={String(user.id)}
          selfId={viewerId ? String(viewerId) : undefined}
          initialFlavors={flavors}
        />
      </section>
    </ViewContextProvider>
  );
}
