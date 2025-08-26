import { SideCalendar } from '@/components/calendar/side-calendar';
import { CakeNavigation } from './cake-navigation';
import { listProfileSnapshotDates } from '@/lib/profile-snapshots';
import { listDailyReportDates } from '@/lib/daily-report-store';
import { GenerateDailyReportButton } from '@/components/progress/generate-daily-report-button';
import { cookies } from 'next/headers';
import { getNow, toYMD } from '@/lib/clock';

export async function CakeHome({ ownerId }: { ownerId: number }) {
  const snapshotDates = await listProfileSnapshotDates(ownerId);
  const reportDates = await listDailyReportDates(ownerId);
  const cookieStore = await cookies();
  const { now } = getNow('UTC', { cookies: cookieStore });
  const todayIso = toYMD(now, 'UTC');
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <SideCalendar snapshotDates={snapshotDates} reportDates={reportDates} />
      <CakeNavigation />
      <GenerateDailyReportButton userId={ownerId} date={todayIso} />
    </section>
  );
}
