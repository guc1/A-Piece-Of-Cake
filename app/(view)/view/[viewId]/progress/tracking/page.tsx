import { getUserByViewId, ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { listFlavorsForViewer } from '@/lib/flavors-store';
import { listSubflavorsForViewer } from '@/lib/subflavors-store';
import { buildProgressTimeline, getTrackingStartDate } from '@/lib/progress-tracking-store';
import { cookies } from 'next/headers';
import { addDays, getNow, startOfDay, toYMD, getUserTimeZone } from '@/lib/clock';
import TrackingClient from '@/components/progress/tracking-client';

export default async function ViewTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string }>;
  searchParams?: Promise<{ at?: string }>;
}) {
  const { viewId } = await params;
  const sp = await searchParams;
  if (sp?.at) notFound();
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  const viewerId = viewer ? viewer.id : null;

  const cookieStore = await cookies();
  const tz = getUserTimeZone(user as any, { cookies: cookieStore });
  const { now } = getNow(tz, { cookies: cookieStore });
  const todayDate = startOfDay(now, tz);
  const today = toYMD(todayDate, tz);
  const start = toYMD(addDays(todayDate, -365, tz), tz);

  const flavors = await listFlavorsForViewer(String(user.id), viewerId);
  const subflavors = await listSubflavorsForViewer(String(user.id), viewerId);

  const timeline = await buildProgressTimeline({
    userId: user.id,
    tz,
    startDate: start,
    endDate: today,
    flavors,
    subflavors,
    now,
  });
  const trackingStart = await getTrackingStartDate(user.id);

  const ctx = buildViewContext({
    ownerId: user.id,
    viewerId: viewerId ?? null,
    mode: 'viewer',
    viewId: user.viewId,
  });

  return (
    <ViewContextProvider value={ctx}>
      <section id={`v13w-progress-tracking-${user.id}`} className="p-6">
        <TrackingClient
          today={today}
          timeZone={tz}
          trackingStart={trackingStart}
          flavors={flavors.map((f) => ({
            id: f.id,
            name: f.name,
            icon: f.icon,
            color: f.color,
            description: f.description,
          }))}
          subflavors={subflavors.map((s) => ({
            id: s.id,
            flavorId: s.flavorId,
            name: s.name,
            icon: s.icon,
            color: s.color,
            description: s.description,
          }))}
          timeline={timeline}
        />
      </section>
    </ViewContextProvider>
  );
}
