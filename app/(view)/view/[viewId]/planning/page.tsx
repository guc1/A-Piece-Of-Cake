import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import PlanningLanding from '@/app/(app)/planning/client';

export default async function ViewPlanningPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  return (
    <section id={`v13w-plan-${user.id}`}>
      <PlanningLanding userId={String(user.id)} />
    </section>
  );
}
