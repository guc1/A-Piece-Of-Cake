import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlan, rolloverPlans } from '@/lib/plans-store';
import { getServerNow } from '@/lib/time';
import EditorClient from './client';

export const revalidate = 0;

export default async function PlanningNextPage() {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const now = await getServerNow();
  await rolloverPlans(String(me.id), now);
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  const date = tomorrow.toISOString().slice(0, 10);
  const plan = await getPlan(String(me.id), date);
  return <EditorClient userId={String(me.id)} date={date} initialPlan={plan} />;
}
