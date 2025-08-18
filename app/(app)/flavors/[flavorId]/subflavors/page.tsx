import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { listSubflavors } from '@/lib/subflavors-store';
import SubflavorsClient from './client';
import { redirect } from 'next/navigation';
import { createSubflavor, updateSubflavor } from './actions';

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
  const createAction = createSubflavor.bind(null, me.id, params.flavorId);
  const updateAction = updateSubflavor.bind(null, me.id, params.flavorId);
  return (
    <SubflavorsClient
      userId={userId}
      flavorId={params.flavorId}
      initialSubflavors={subflavors}
      createSubflavorAction={createAction}
      updateSubflavorAction={updateAction}
      editable={true}
    />
  );
}
