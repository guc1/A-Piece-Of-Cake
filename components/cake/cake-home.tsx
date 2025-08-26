import { SideCalendar } from '@/components/calendar/side-calendar';
import { CakeNavigation } from './cake-navigation';
import { listProfileSnapshotDates } from '@/lib/profile-snapshots';
import { listDailyReportDates } from '@/lib/daily-report-store';
import { GenerateDailyReportButton } from '@/components/progress/generate-daily-report-button';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { cookies } from 'next/headers';

export async function CakeHome({ ownerId }: { ownerId: number }) {
  const snapshotDates = await listProfileSnapshotDates(ownerId);
  const reportDates = await listDailyReportDates(ownerId);
  const cookieStore = await cookies();
  const { date, tz } = resolvePlanDate('live', { timeZone: undefined }, {
    cookies: cookieStore,
    searchParams: {},
  });
  const today = toYMD(date, tz);
  const hasReport = reportDates.includes(today);
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <SideCalendar snapshotDates={snapshotDates} reportDates={reportDates} />
      <CakeNavigation />
      <GenerateDailyReportButton userId={ownerId} hasReport={hasReport} />
    </section>
  );
}
