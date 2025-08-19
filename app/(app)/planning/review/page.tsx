import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlan } from '@/lib/plans-store';
import { getSiteDate } from '@/lib/site-date';
import EditorClient from '../next/client';

export const revalidate = 0;

export default async function PlanningReviewPage() {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const now = await getSiteDate();
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
