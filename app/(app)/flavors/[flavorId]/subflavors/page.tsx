import { auth } from '@/lib/auth';
import { listSubflavors } from '@/lib/subflavors-store';
import SubflavorsClient from './client';

export default async function SubflavorsPage({
  params,
}: {
  params: { flavorId: string };
}) {
  const session = await auth();
  const userId = (session?.user as any)?.id || '';
  const subflavors = userId
    ? await listSubflavors(userId, params.flavorId)
    : [];
  return (
    <SubflavorsClient
      userId={userId}
      flavorId={params.flavorId}
      initialSubflavors={subflavors}
    />
  );
}
