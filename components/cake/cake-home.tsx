import { SideCalendar } from '@/components/calendar/side-calendar';
import { CakeNavigation } from './cake-navigation';

export function CakeHome({
  snapshotDates = [],
}: {
  snapshotDates?: string[];
}) {
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <SideCalendar snapshotDates={snapshotDates} />
      <CakeNavigation />
    </section>
  );
}
