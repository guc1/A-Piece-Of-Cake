import { getUserByViewId, ensureUser } from '@/lib/users';
import { auth } from '@/lib/auth';
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
import { canViewerSeeFlavor } from '@/lib/flavors-store';
import { canViewerSeeSubflavor } from '@/lib/subflavors-store';

export default async function ViewHistoryTrackingPage({
  params,
}: {
  params: Promise<{ viewId: string; date: string }>;
}) {
  const { viewId, date } = await params;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const snapshot = await getProfileSnapshot(owner.id, date);
  if (!snapshot) notFound();

  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  const viewerId = viewer ? viewer.id : null;

  const cookieStore = await cookies();
  const tz = getUserTimeZone(owner as any, { cookies: cookieStore });
  const dayStart = parseYMD(date, tz);
  const rangeStart = addDays(dayStart, -364, tz);
  const startDate = toYMD(rangeStart, tz);
  const endDate = date;
  const now = new Date(addDays(dayStart, 1, tz).getTime() - 1);

  const rawFlavors = normalizeSnapshotFlavors(snapshot.flavors, owner.id);
  const flavorChecks = await Promise.all(
    rawFlavors.map(async (flavor) => ({
      flavor,
      allowed: await canViewerSeeFlavor(viewerId, owner.id, flavor.visibility),
    })),
  );
  const flavors = flavorChecks
    .filter((item) => item.allowed)
    .map((item) => item.flavor);
  const visibleFlavorIds = new Set(flavors.map((flavor) => flavor.id));

  const rawSubflavors = normalizeSnapshotSubflavors(snapshot.subflavors, owner.id);
  const subChecks = await Promise.all(
    rawSubflavors.map(async (sub) => ({
      sub,
      allowed:
        visibleFlavorIds.has(sub.flavorId) &&
        (await canViewerSeeSubflavor(viewerId, owner.id, sub.visibility)),
    })),
  );
  const subflavors = subChecks
    .filter((item) => item.allowed)
    .map((item) => item.sub);

  const timeline = await buildProgressTimeline({
    userId: owner.id,
    tz,
    startDate,
    endDate,
    flavors,
    subflavors,
    now,
  });
  const trackingStart = await getTrackingStartDate(owner.id);

  return (
    <section
      id={`hist-view-progress-tracking-${owner.id}-${date}`}
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
