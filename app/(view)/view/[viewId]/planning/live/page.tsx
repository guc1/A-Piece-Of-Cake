import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlan } from '@/lib/plans-store';
import EditorClient from '@/app/(app)/planning/next/client';

export default async function ViewPlanningLivePage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const now = new Date();
  const { date: raw } = await searchParams;
  const date = raw ?? now.toISOString().slice(0, 10);
  const plan = await getPlan(String(user.id), date);
  return (
    <section id={`v13w-plan-${user.id}`}>
      <EditorClient
        userId={String(user.id)}
        date={date}
        initialPlan={plan}
        live
      />
    </section>
  );
}
