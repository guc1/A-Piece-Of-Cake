import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';

export function ReviewHome() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Review</h1>
    </section>
  );
}

export default async function ReviewPage() {
  const session = await auth();
  if (!session) redirect('/');
  await ensureUser(session);
  return <ReviewHome />;
}
