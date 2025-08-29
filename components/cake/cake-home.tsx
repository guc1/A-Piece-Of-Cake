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
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-5xl rounded-lg bg-white p-6 shadow">
          <CakeNavigation />
        </div>
      </div>
    </section>
  );
}
