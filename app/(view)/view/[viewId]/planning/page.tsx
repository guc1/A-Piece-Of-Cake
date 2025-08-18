import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { PlanningHome } from '@/app/(app)/planning/page';

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
      <PlanningHome />
    </section>
  );
}
