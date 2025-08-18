import { CakeNavigation } from '@/components/cake/cake-navigation';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';

export function CakeHome() {
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <CakeNavigation />
    </section>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/');
  const me = await ensureUser(session);
  const { uid } = await searchParams;
  if (!uid || Number(uid) !== me.id) {
    redirect(`/?uid=${me.id}`);
  }
  return <CakeHome />;
}
