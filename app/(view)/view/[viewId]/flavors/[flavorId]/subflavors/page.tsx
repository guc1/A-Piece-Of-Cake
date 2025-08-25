import { getUserByViewId, ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { listSubflavors } from '@/lib/subflavors-store';
import { getFlavor, listFlavors } from '@/lib/flavors-store';
import AllSubflavorsClient from '@/app/(view)/view/[viewId]/subflavors/client';
import { auth } from '@/lib/auth';

export default async function ViewSubflavorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string; flavorId: string }>;
  searchParams?: Promise<{ to?: string }>;
}) {
  const { viewId, flavorId } = await params;
  const sp = await searchParams;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  const subflavors = await listSubflavors(String(user.id), flavorId);
  const flavor = await getFlavor(String(user.id), flavorId, viewer?.id || null);
  if (!flavor) notFound();
  const viewerFlavors = viewer ? await listFlavors(String(viewer.id)) : [];
  return (
    <section id={`v13w-subflav-${user.id}-${flavorId}`}>
      <AllSubflavorsClient
        userId={String(user.id)}
        selfId={viewer ? String(viewer.id) : undefined}
        groups={[{ flavor, subflavors }]}
        targetFlavorId={sp?.to}
        selfFlavors={viewerFlavors}
      />
    </section>
  );
}
