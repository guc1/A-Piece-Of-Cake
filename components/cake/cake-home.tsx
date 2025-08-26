import { SideCalendar } from '@/components/calendar/side-calendar';
import { CakeNavigation } from './cake-navigation';
import { listProfileSnapshotDates } from '@/lib/profile-snapshots';
import { listDailyReportDates, getDailyReport } from '@/lib/daily-report-store';
import { GenerateDailyReportButton } from '@/components/progress/generate-daily-report-button';

export async function CakeHome({ ownerId }: { ownerId: number }) {
  const snapshotDates = await listProfileSnapshotDates(ownerId);
  const reportDates = await listDailyReportDates(ownerId);
  const todayIso = new Date().toISOString().slice(0, 10);
  const hasReportToday = !!(await getDailyReport(ownerId, todayIso));
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <SideCalendar snapshotDates={snapshotDates} reportDates={reportDates} />
      <CakeNavigation />
      {!hasReportToday && <GenerateDailyReportButton />}
    </section>
  );
}
