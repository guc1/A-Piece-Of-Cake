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

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: { uid?: string };
}) {
  const session = await auth();
  if (!session) redirect('/');
  const me = await ensureUser(session);
  if (!searchParams.uid || Number(searchParams.uid) !== me.id) {
    redirect(`/planning?uid=${me.id}`);
  }
  return <PlanningHome />;
}
