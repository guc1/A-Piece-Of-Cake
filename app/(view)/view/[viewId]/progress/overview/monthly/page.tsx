import { getUserByViewId, ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { MonthlyReportsHome } from '@/app/progress/overview/monthly/page';

export default async function ViewMonthlyReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string }>;
  searchParams?: Promise<{ at?: string }>;
}) {
  const { viewId } = await params;
  const sp = await searchParams;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  const viewerId = viewer ? viewer.id : null;
  if (sp?.at) notFound();
  const ctx = buildViewContext({
    ownerId: user.id,
    viewerId: viewerId ?? null,
    mode: 'viewer',
    viewId: user.viewId,
  });
  return (
    <ViewContextProvider value={ctx}>
      <section id={`v13w-progress-monthly-${user.id}`}>
        <MonthlyReportsHome userId={user.id} />
      </section>
    </ViewContextProvider>
  );
}
