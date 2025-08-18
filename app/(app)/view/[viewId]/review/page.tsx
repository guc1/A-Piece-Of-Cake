import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';

export default async function ViewReviewPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  return (
    <section id={`v13w-revw-${user.id}`}>
      <h1 className="text-2xl font-bold">Review</h1>
    </section>
  );
}
