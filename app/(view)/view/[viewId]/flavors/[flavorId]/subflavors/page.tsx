import { getUserByViewId, ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { listSubflavors } from '@/lib/subflavors-store';
import SubflavorsClient from '@/app/(app)/flavors/[flavorId]/subflavors/client';
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
  return (
    <section id={`v13w-subflav-${user.id}-${flavorId}`}>
      <SubflavorsClient
        userId={String(user.id)}
        selfId={viewer ? String(viewer.id) : undefined}
        flavorId={flavorId}
        initialSubflavors={subflavors}
        targetFlavorId={sp?.to}
      />
    </section>
  );
}
