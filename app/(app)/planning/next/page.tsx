import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlan } from '@/lib/plans-store';
import { getSiteDate } from '@/lib/site-date';
import EditorClient from './client';

export const revalidate = 0;

export default async function PlanningNextPage() {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const now = await getSiteDate();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  const date = tomorrow.toISOString().slice(0, 10);
  const plan = await getPlan(String(me.id), date);
  return <EditorClient userId={String(me.id)} date={date} initialPlan={plan} />;
}
