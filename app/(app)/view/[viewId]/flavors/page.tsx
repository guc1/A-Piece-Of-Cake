import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import FlavorsPage from '../../../flavors/page';

export default async function ViewFlavorsPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  return (
    <section id={`v13w-flav-${user.id}`}>
      <FlavorsPage params={{ viewId }} />
    </section>
  );
}
