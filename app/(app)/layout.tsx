import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ensureUser, getUserByViewId } from '@/lib/users';
import { buildViewContext, canViewProfile } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { AppNav } from '@/components/app-nav';
import { ViewerBar } from '@/components/viewer-bar';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ viewId?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/');
  }
  const { viewId } = await params;
  const viewerId = Number(session.user.id);

  let ctx;
  if (viewId) {
    const user = await getUserByViewId(viewId);
    if (!user) notFound();
    const allowed = await canViewProfile({
      viewerId,
      targetUser: {
        id: user.id,
        accountVisibility: user.accountVisibility as any,
      },
    });
    if (!allowed) notFound();
    ctx = buildViewContext(user.id, viewerId, viewId);
  } else {
    const me = await ensureUser(session);
    ctx = buildViewContext(me.id, viewerId, me.viewId);
  }

  return (
    <html lang="en">
      <body>
        <ViewContextProvider value={ctx}>
          <AppNav />
          <main className="p-4">
            <div id={`v13wctx-${ctx.ownerId}-${ctx.viewerId || 0}`}>{children}</div>
          </main>
          {ctx.mode === 'viewer' && <ViewerBar />}
        </ViewContextProvider>
      </body>
    </html>
  );
}
