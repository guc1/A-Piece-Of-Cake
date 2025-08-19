import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlan } from '@/lib/plans-store';
import { getServerTomorrow } from '@/lib/time';
import EditorClient from './client';

export const revalidate = 0;

export default async function PlanningNextPage() {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const tomorrow = await getServerTomorrow();
  const date = tomorrow.toISOString().slice(0, 10);
  const plan = await getPlan(String(me.id), date);
  return <EditorClient userId={String(me.id)} date={date} initialPlan={plan} />;
}
