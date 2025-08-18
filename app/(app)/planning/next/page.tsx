import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getPlan } from '@/lib/planning-store';
import PlanningEditor from './planner';

function tomorrowISO() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return now.toISOString().slice(0, 10);
}

export default async function PlanningNextPage() {
  const session = await auth();
  const me = await ensureUser(session);
  const date = tomorrowISO();
  const { blocks } = await getPlan(String(me.id), date);
  return (
    <PlanningEditor userId={String(me.id)} initialBlocks={blocks} date={date} />
  );
}
