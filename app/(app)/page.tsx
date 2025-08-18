import { CakeHome } from '@/components/cake/cake-home';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { listSnapshotDates } from '@/lib/profile-snapshots';

export default async function DashboardPage() {
  const session = await auth();
  const me = await ensureUser(session);
  const dates = await listSnapshotDates(me.id);
  return <CakeHome snapshotDates={dates} />;
}
