import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import FlavorsClient from './client';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';

export default async function FlavorsPage() {
  const session = await auth();
  if (!session) redirect('/');
  const me = await ensureUser(session);
  const flavors = await listFlavors(String(me.id));
  return <FlavorsClient userId={String(me.id)} initialFlavors={flavors} />;
}
