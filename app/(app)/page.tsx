import { CakeHome } from '@/components/cake/cake-home';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';

export default async function DashboardPage() {
  const session = await auth();
  const me = await ensureUser(session!);
  return <CakeHome ownerId={me.id} />;
}
