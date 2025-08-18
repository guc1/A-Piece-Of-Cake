import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';

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
      <h1 className="text-2xl font-bold">Ingredients</h1>
    </section>
  );
}
