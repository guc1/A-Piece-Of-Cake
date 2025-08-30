import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getHeadingReportAt } from '@/lib/heading-report-store';
import { getUserTimeZone, startOfDay, addDays, toYMD } from '@/lib/clock';
import { cookies } from 'next/headers';
import { ReviewHome } from '@/app/(app)/review/client';

export const revalidate = 0;

export default async function HistorySelfReview({
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
  const tz = getUserTimeZone(me, { cookies: cookieStore });
  const day = startOfDay(new Date(date), tz);
  const dateStr = toYMD(day, tz);
  const at = snapshot.createdAt ?? addDays(day, 1, tz);
  const report = await getHeadingReportAt(me.id, dateStr, at);
  return (
    <section id={`hist-self-review-${me.id}-${date}`}>
      <ReviewHome userId={me.id} initialReport={report} />
    </section>
  );
}
