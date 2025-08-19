import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlan, rolloverPlans } from '@/lib/plans-store';
import { getServerNow } from '@/lib/time';
import EditorClient from '../next/client';

export const revalidate = 0;

export default async function PlanningReviewPage() {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const now = await getServerNow();
  await rolloverPlans(String(me.id), now);
  const date = now.toISOString().slice(0, 10);
  const plan = await getPlan(String(me.id), date);
  return (
    <EditorClient
      userId={String(me.id)}
      date={date}
      initialPlan={plan}
      live
      review
    />
  );
}
