import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { listSubflavors } from '@/lib/subflavors-store';
import SubflavorsClient from '@/app/(app)/flavors/[flavorId]/subflavors/client';

export default async function ViewSubflavorsPage({
  params,
}: {
  params: Promise<{ viewId: string; flavorId: string }>;
}) {
  const { viewId, flavorId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const subflavors = await listSubflavors(String(user.id), flavorId);
  return (
    <section id={`v13w-subflav-${user.id}-${flavorId}`}>
      <SubflavorsClient
        userId={String(user.id)}
        flavorId={flavorId}
        initialSubflavors={subflavors}
      />
    </section>
  );
}
