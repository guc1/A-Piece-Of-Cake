import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { IngredientsHome } from '../../../ingredients/page';

export default async function ViewIngredientsPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  return (
    <section id={`v13w-igrd-${user.id}`}>
      <IngredientsHome />
    </section>
  );
}
