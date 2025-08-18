import { CakeNavigation } from '@/components/cake/cake-navigation';

export function CakeHome() {
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <CakeNavigation />
    </section>
  );
}

export default function DashboardPage() {
  return <CakeHome />;
}
