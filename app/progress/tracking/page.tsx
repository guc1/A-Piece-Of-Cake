import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserTimeZone } from '@/lib/clock';
import { buildTrackingDataset } from '@/lib/progress-tracking';
import TrackingClient from '@/components/progress/tracking-client';

export async function TrackingHome({
  ownerId,
  viewerId,
  tz,
}: {
  ownerId: number;
  viewerId?: number | null;
  tz: string;
}) {
  const dataset = await buildTrackingDataset({ ownerId, viewerId, tz });
  return (
    <main className="p-6">
      <TrackingClient dataset={dataset} />
    </main>
  );
}

export default async function TrackingPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  const cookieStore = await cookies();
  const tz = getUserTimeZone(me as any, { cookies: cookieStore });
  return <TrackingHome ownerId={me.id} tz={tz} />;
}
