import { getUserByViewId, ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { DailyReportDetailView } from '@/app/progress/overview/daily/[date]/page';

export default async function ViewDailyReportDetail({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string; date: string }>;
  searchParams?: Promise<{ at?: string }>;
}) {
  const { viewId, date } = await params;
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
      <section id={`v13w-progress-daily-${user.id}-${date}`}>
        <DailyReportDetailView userId={user.id} slug={date} />
      </section>
    </ViewContextProvider>
  );
}
