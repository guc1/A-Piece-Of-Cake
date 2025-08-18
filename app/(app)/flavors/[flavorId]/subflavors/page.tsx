import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { listSubflavors } from '@/lib/subflavors-store';
import SubflavorsClient from './client';
import { redirect } from 'next/navigation';

export default async function SubflavorsPage({
  params,
}: {
  params: { flavorId: string };
}) {
  const session = await auth();
  if (!session) redirect('/');
  const me = await ensureUser(session);
  const userId = String(me.id);
  const subflavors = await listSubflavors(userId, params.flavorId);
  return (
    <SubflavorsClient
      userId={userId}
      flavorId={params.flavorId}
      initialSubflavors={subflavors}
    />
  );
}
