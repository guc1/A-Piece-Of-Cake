import { getUserByViewId } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { notFound } from 'next/navigation';
import { getHeadingReportAt } from '@/lib/heading-report-store';
import { getUserTimeZone, startOfDay, addDays, toYMD } from '@/lib/clock';
import { cookies } from 'next/headers';
import { ReviewHome } from '@/app/(app)/review/client';

export const revalidate = 0;

export default async function HistoryReview({
  params,
}: {
  params: Promise<{ viewId: string; date: string }>;
}) {
  const { viewId, date } = await params;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const snapshot = await getProfileSnapshot(owner.id, date);
  if (!snapshot) notFound();
  const cookieStore = await cookies();
  const tz = getUserTimeZone(owner, { cookies: cookieStore });
  const day = startOfDay(new Date(date), tz);
  const dateStr = toYMD(day, tz);
  const at = snapshot.createdAt ?? addDays(day, 1, tz);
  const report = await getHeadingReportAt(owner.id, dateStr, at);
  return (
    <section id={`hist-review-${owner.id}-${date}`}>
      <ReviewHome userId={owner.id} initialReport={report} />
    </section>
  );
}
