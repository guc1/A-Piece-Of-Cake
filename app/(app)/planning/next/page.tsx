import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlan } from '@/lib/plans-store';
import EditorClient from './client';

export default async function PlanningNextPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const { date: rawDate } = await searchParams;
  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  const date = rawDate || tomorrow.toISOString().slice(0, 10);
  const plan = await getPlan(String(me.id), date);
  return (
    <EditorClient userId={String(me.id)} date={date} initialPlan={plan} />
  );
}
