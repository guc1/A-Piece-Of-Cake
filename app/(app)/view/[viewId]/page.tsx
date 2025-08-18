import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { CakeNavigation } from '@/components/cake/cake-navigation';

export default async function ViewPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  return (
    <section id={`v13w-cake-${user.id}`} className="w-full">
      <h1 className="sr-only">Cake</h1>
      <CakeNavigation />
    </section>
  );
}
