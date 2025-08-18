import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import FlavorsClient from './client';

export default async function FlavorsPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const session = await auth();
  const ownViewId = (session?.user as any)?.viewId || '';
  const viewingId = searchParams?.view || ownViewId;
  const flavors = viewingId ? await listFlavors(viewingId) : [];
  return (
    <FlavorsClient
      userId={viewingId}
      initialFlavors={flavors}
      readOnly={viewingId !== ownViewId}
    />
  );
}
