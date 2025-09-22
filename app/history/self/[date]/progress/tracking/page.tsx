import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { addDays, getUserTimeZone, parseYMD, toYMD } from '@/lib/clock';
import TrackingClient from '@/components/progress/tracking-client';
import {
  buildProgressTimeline,
  getTrackingStartDate,
  normalizeSnapshotFlavors,
  normalizeSnapshotSubflavors,
} from '@/lib/progress-tracking-store';

export default async function HistorySelfTrackingPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const snapshot = await getProfileSnapshot(me.id, date);
  if (!snapshot) notFound();

  const cookieStore = await cookies();
  const tz = getUserTimeZone(me as any, { cookies: cookieStore });
  const dayStart = parseYMD(date, tz);
  const rangeStart = addDays(dayStart, -364, tz);
  const startDate = toYMD(rangeStart, tz);
  const endDate = date;
  const now = new Date(addDays(dayStart, 1, tz).getTime() - 1);

  const flavors = normalizeSnapshotFlavors(snapshot.flavors, me.id);
  const subflavors = normalizeSnapshotSubflavors(snapshot.subflavors, me.id);

  const timeline = await buildProgressTimeline({
    userId: me.id,
    tz,
    startDate,
    endDate,
    flavors,
    subflavors,
    now,
  });
  const trackingStart = await getTrackingStartDate(me.id);

  return (
    <section
      id={`hist-self-progress-tracking-${me.id}-${date}`}
      className="space-y-6"
    >
      <TrackingClient
        today={date}
        timeZone={tz}
        trackingStart={trackingStart}
        flavors={flavors.map((flavor) => ({
          id: flavor.id,
          name: flavor.name,
          icon: flavor.icon,
          color: flavor.color,
          description: flavor.description,
        }))}
        subflavors={subflavors.map((sub) => ({
          id: sub.id,
          flavorId: sub.flavorId,
          name: sub.name,
          icon: sub.icon,
          color: sub.color,
          description: sub.description,
        }))}
        timeline={timeline}
      />
    </section>
  );
}
