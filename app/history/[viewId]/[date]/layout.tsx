import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserByViewId } from '@/lib/users';
import { buildViewContext, canViewProfile } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { AppNav } from '@/components/app-nav';
import { ViewerBar } from '@/components/viewer-bar';

export default async function HistoryViewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ viewId: string; date: string }>;
}) {
  const { viewId, date } = await params;
  const session = await auth();
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const allowed = await canViewProfile({
    viewerId,
    targetUser: { id: owner.id, accountVisibility: owner.accountVisibility as any },
  });
  if (!allowed) notFound();
  const ctx = buildViewContext({
    ownerId: owner.id,
    viewerId,
    mode: 'historical',
    viewId,
    snapshotDate: date,
  });
  return (
    <html lang="en">
      <body>
        <ViewContextProvider value={ctx}>
          <AppNav />
          <main className="p-4">
            <div id={`v13wctx-${ctx.ownerId}-${ctx.viewerId || 0}`}>{children}</div>
          </main>
          <ViewerBar />
        </ViewContextProvider>
      </body>
    </html>
  );
}
