import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';

export default async function VisibilityPage({
  searchParams,
}: {
  searchParams: { uid?: string };
}) {
  const session = await auth();
  if (!session) redirect('/');
  const me = await ensureUser(session);
  if (!searchParams.uid || Number(searchParams.uid) !== me.id) {
    redirect(`/visibility?uid=${me.id}`);
  }
  return (
    <section>
      <h1 className="text-2xl font-bold">Visibility</h1>
    </section>
  );
}
