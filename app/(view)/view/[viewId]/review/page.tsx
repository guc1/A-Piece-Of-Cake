import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';
import { ReviewHome } from '@/app/(app)/review/client';
import { getLatestHeadingReport } from '@/lib/heading-report-store';

export const revalidate = 0;

export default async function ViewReviewPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const report = await getLatestHeadingReport(user.id);
  return (
    <section id={`v13w-revw-${user.id}`}>
      <ReviewHome userId={user.id} initialReport={report} />
    </section>
  );
}
