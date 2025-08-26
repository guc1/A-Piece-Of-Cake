import { SideCalendar } from '@/components/calendar/side-calendar';
import { CakeNavigation } from './cake-navigation';
import { listProfileSnapshotDates } from '@/lib/profile-snapshots';
import { listDailyReportDates } from '@/lib/daily-report-store';
import { GenerateDailyReportButton } from '@/components/progress/generate-daily-report-button';
import { auth } from '@/lib/auth';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { cookies } from 'next/headers';

export async function CakeHome({ ownerId }: { ownerId: number }) {
  const snapshotDates = await listProfileSnapshotDates(ownerId);
  const reportDates = await listDailyReportDates(ownerId);
  const session = await auth();
  const cookieStore = await cookies();
  const { date: dateObj, tz } = resolvePlanDate('live', session?.user as any, {
    cookies: cookieStore,
    searchParams: {},
  });
  const today = toYMD(dateObj, tz);
  const showButton =
    Number(session?.user?.id) === ownerId && !reportDates.includes(today);
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <SideCalendar snapshotDates={snapshotDates} reportDates={reportDates} />
      <CakeNavigation />
      {showButton && <GenerateDailyReportButton userId={ownerId} />}
    </section>
  );
}
