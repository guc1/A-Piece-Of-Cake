import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { ReviewHome } from '@/app/(app)/review/page';

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
      <ReviewHome />
    </section>
  );
}
