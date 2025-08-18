import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';

export function PlanningHome() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Planning</h1>
    </section>
  );
}

export default async function PlanningPage() {
  const session = await auth();
  if (!session) redirect('/');
  await ensureUser(session);
  return <PlanningHome />;
}
