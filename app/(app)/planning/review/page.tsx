import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlan } from '@/lib/plans-store';
import EditorClient from '../next/client';

export default async function PlanningReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const now = new Date();
  const { date: raw } = await searchParams;
  const date = raw ?? now.toISOString().slice(0, 10);
  const plan = await getPlan(String(me.id), date);
  return (
    <EditorClient
      userId={String(me.id)}
      date={date}
      initialPlan={plan}
      review
    />
  );
}
