import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { CakeHome } from '@/components/cake/cake-home';

export default async function ViewCakePage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  return (
    <section id={`v13w-cake-${user.id}`}>
      <CakeHome ownerId={user.id} />
    </section>
  );
}
