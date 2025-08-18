import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import CakePage from '../../page';

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
      <CakePage />
    </section>
  );
}
