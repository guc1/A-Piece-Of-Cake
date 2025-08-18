import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getPlan } from '@/lib/planning-store';
import PlanningEditor from '@/app/(app)/planning/next/planner';

function tomorrowISO() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return now.toISOString().slice(0, 10);
}

export default async function ViewPlanningNextPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const date = tomorrowISO();
  const { blocks } = await getPlan(String(user.id), date);
  return (
    <PlanningEditor
      userId={String(user.id)}
      initialBlocks={blocks}
      date={date}
    />
  );
}
