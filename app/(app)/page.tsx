import { CakeNavigation } from '@/components/cake/cake-navigation';
import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();
  const readOnly = Boolean((session?.user as any)?.originalId);
  const userId = session?.user?.id;
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      <CakeNavigation userId={userId} readOnly={readOnly} />
    </section>
  );
}
