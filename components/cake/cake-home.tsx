import { SideCalendar } from '@/components/calendar/side-calendar';
import { CakeNavigation } from './cake-navigation';
import { listProfileSnapshotDates } from '@/lib/profile-snapshots';
import { listDailyReportDates } from '@/lib/daily-reports';
import { GenerateDailyReportButton } from '@/components/progress/generate-daily-report-button';

export async function CakeHome({ ownerId }: { ownerId: number }) {
  const snapshotDates = await listProfileSnapshotDates(ownerId);
  const reportDates = await listDailyReportDates(ownerId);
  const todayIso = new Date().toLocaleDateString('en-CA');
  const hasReportToday = reportDates.includes(todayIso);
  return (
    <section className="w-full space-y-4">
      <h1 className="sr-only">Cake</h1>
      <SideCalendar snapshotDates={snapshotDates} reportDates={reportDates} />
      {!hasReportToday && <GenerateDailyReportButton />}
      <CakeNavigation />
    </section>
  );
}
