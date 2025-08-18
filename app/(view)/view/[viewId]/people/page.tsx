import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import PeoplePage from '@/app/(app)/people/page';
import { auth } from '@/lib/auth';

export default async function ViewPeoplePage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const session = await auth();
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  if (viewerId !== user.id) {
    return (
      <section id={`v13w-peep-${user.id}`}>
        <p>Not accessible for safety reasons.</p>
      </section>
    );
  }
  return (
    <section id={`v13w-peep-${user.id}`}>
      <PeoplePage params={{ viewId }} />
    </section>
  );
}
