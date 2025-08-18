import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import PlanningLanding from './client';

export default async function PlanningPage() {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  return <PlanningLanding userId={String(me.id)} />;
}
