import { CakeHome } from '@/components/cake/cake-home';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect('/signin');
  }
  const me = await ensureUser(session);
  return <CakeHome ownerId={me.id} />;
}
