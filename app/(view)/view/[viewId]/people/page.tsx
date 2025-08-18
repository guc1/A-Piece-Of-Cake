import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import PeoplePage from '@/app/(app)/people/page';

export default async function ViewPeoplePage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  return (
    <section id={`v13w-peep-${user.id}`}>
      <PeoplePage params={{ viewId }} />
    </section>
  );
}
