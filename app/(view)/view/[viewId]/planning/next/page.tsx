import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlan } from '@/lib/plans-store';
import { getServerTomorrow } from '@/lib/time';
import EditorClient from '@/app/(app)/planning/next/client';

export default async function ViewPlanningNextPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const tomorrow = await getServerTomorrow();
  const date = tomorrow.toISOString().slice(0, 10);
  const plan = await getPlan(String(user.id), date);
  return (
    <section id={`v13w-plan-${user.id}`}>
      <EditorClient userId={String(user.id)} date={date} initialPlan={plan} />
    </section>
  );
}
