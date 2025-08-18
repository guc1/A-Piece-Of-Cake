import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';

export default async function VisibilityPage() {
  const session = await auth();
  if (!session) redirect('/');
  await ensureUser(session);
  return (
    <section>
      <h1 className="text-2xl font-bold">Visibility</h1>
    </section>
  );
}
