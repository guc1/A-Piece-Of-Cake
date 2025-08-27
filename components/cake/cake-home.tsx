import { SideCalendar } from '@/components/calendar/side-calendar';
import { CakeNavigation } from './cake-navigation';
import { listProfileSnapshotDates } from '@/lib/profile-snapshots';
import { listDailyReportDates } from '@/lib/daily-report-store';

export async function CakeHome({ ownerId }: { ownerId: number }) {
  const snapshotDates = await listProfileSnapshotDates(ownerId);
  const reportDates = await listDailyReportDates(ownerId);
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <SideCalendar snapshotDates={snapshotDates} reportDates={reportDates} />
      <CakeNavigation />
    </section>
  );
}
