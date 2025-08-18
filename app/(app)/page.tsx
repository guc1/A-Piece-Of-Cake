import { CakeNavigation } from '@/components/cake/cake-navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  const ownViewId = (session?.user as any)?.viewId;
  const params = await searchParams;
  const viewingId = params.view;
  const readOnly = viewingId && viewingId !== ownViewId;
  const userId = viewingId ?? 'self';
  return (
    <section className="w-full">
      <h1 className="sr-only">Cake</h1>
      {readOnly && (
        <div className="fixed left-4 bottom-4 z-50 flex gap-2">
          <Button variant="outline" disabled>
            Viewer
          </Button>
          <Link href="/">
            <Button variant="outline">Exit</Button>
          </Link>
        </div>
      )}
      <CakeNavigation userId={userId} readOnly={!!readOnly} />
    </section>
  );
}
