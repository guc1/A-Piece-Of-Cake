import { SideCalendar } from '@/components/calendar/side-calendar';
import { CakeNavigation } from './cake-navigation';

export function CakeHome() {
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <SideCalendar />
      <CakeNavigation />
    </section>
  );
}
