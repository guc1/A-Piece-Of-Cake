import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import BackButton from '@/components/back-button';
import { cookies } from 'next/headers';
import { addDays, getNow, startOfDay, toYMD, getUserTimeZone } from '@/lib/clock';
import { listFlavors } from '@/lib/flavors-store';
import { listAllSubflavors } from '@/lib/subflavors-store';
import TrackingClient from '@/components/progress/tracking-client';
import { buildProgressTimeline, getTrackingStartDate } from '@/lib/progress-tracking-store';

export default async function ProgressTrackingPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  const cookieStore = await cookies();
  const tz = getUserTimeZone(me as any, { cookies: cookieStore });
  const { now } = getNow(tz, { cookies: cookieStore });
  const todayDate = startOfDay(now, tz);
  const today = toYMD(todayDate, tz);
  const start = toYMD(addDays(todayDate, -365, tz), tz);
  const flavors = await listFlavors(String(me.id));
  const subflavors = await listAllSubflavors(String(me.id));
  const timeline = await buildProgressTimeline({
    userId: me.id,
    tz,
    startDate: start,
    endDate: today,
    flavors,
    subflavors,
    now,
  });
  const trackingStart = await getTrackingStartDate(me.id);

  return (
    <main className="space-y-6 p-6">
      <BackButton />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-orange-600">Progress tracking</h1>
        <p className="max-w-2xl text-sm text-gray-600">
          Keep a playful bird&apos;s-eye view of your flavours and time. Switch
          between streaks and time spent to celebrate the momentum behind your
          cake.
        </p>
      </div>
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
    </main>
  );
}
