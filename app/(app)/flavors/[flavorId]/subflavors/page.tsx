import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { listSubflavors } from '@/lib/subflavors-store';
import SubflavorsClient from './client';
import { redirect } from 'next/navigation';
import { listPeople } from '@/lib/people-store';

export default async function SubflavorsPage({
  params,
}: {
  params: Promise<{ flavorId: string }>;
}) {
  const { flavorId } = await params;
  const session = await auth();
  if (!session) redirect('/');
  const me = await ensureUser(session);
  const userId = String(me.id);
  const subflavors = await listSubflavors(userId, flavorId);
  const people = await listPeople(me.id);
  return (
    <SubflavorsClient
      userId={userId}
      selfId={userId}
      flavorId={flavorId}
      initialSubflavors={subflavors}
      people={people}
      targetFlavorId={flavorId}
    />
  );
}
