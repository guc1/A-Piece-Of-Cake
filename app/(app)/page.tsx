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

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/');
  await ensureUser(session);
  return <CakeHome />;
}
