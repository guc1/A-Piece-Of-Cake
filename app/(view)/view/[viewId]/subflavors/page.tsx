import { getUserByViewId, ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import { listSubflavors } from '@/lib/subflavors-store';
import type { Flavor } from '@/types/flavor';
import type { Subflavor } from '@/types/subflavor';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import SubflavorsAllClient from './client';

export default async function ViewAllSubflavorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string }>;
  searchParams?: Promise<{ to?: string; at?: string }>;
}) {
  const { viewId } = await params;
  const sp = await searchParams;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  const viewerId = viewer ? viewer.id : null;
  const flavors = await listFlavors(String(user.id));
  const groups: { flavor: Flavor; subflavors: Subflavor[] }[] = [];
  for (const f of flavors) {
    const subs = await listSubflavors(String(user.id), f.id);
    groups.push({ flavor: f, subflavors: subs });
  }
  const ctx = buildViewContext({
    ownerId: user.id,
    viewerId: viewerId ?? null,
    mode: sp?.at ? 'historical' : 'viewer',
    viewId: user.viewId,
    snapshotDate: sp?.at,
  });
  return (
    <ViewContextProvider value={ctx}>
      <section id={`v13w-allsubflav-${user.id}`}>
        <SubflavorsAllClient
          fromUserId={String(user.id)}
          groups={groups}
          targetFlavorId={sp?.to}
        />
      </section>
    </ViewContextProvider>
  );
}
