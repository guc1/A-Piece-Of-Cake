import { SideCalendar } from '@/components/calendar/side-calendar';
import { CakeNavigation } from './cake-navigation';
import { listProfileSnapshotDates } from '@/lib/profile-snapshots';

export async function CakeHome({ ownerId }: { ownerId: number }) {
  const snapshotDates = await listProfileSnapshotDates(ownerId);
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <SideCalendar snapshotDates={snapshotDates} />
      <CakeNavigation />
    </section>
  );
}
