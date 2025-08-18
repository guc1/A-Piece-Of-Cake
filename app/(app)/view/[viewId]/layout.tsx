import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserByViewId } from '@/lib/users';
import { buildViewContext, canViewProfile } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { AppNav } from '@/components/app-nav';
import { ViewerBar } from '@/components/viewer-bar';

export default async function ViewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ viewId: string }>;
}) {
  const session = await auth();
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  const allowed = await canViewProfile({
    viewerId,
    targetUser: { id: user.id, accountVisibility: user.accountVisibility as any },
  });
  if (!allowed) notFound();
  const ctx = buildViewContext('viewer', user.id, viewerId, viewId);
  if (process.env.NODE_ENV !== 'production') {
    console.log({ pathname: `/view/${viewId}`, mode: ctx.mode, ownerId: ctx.ownerId, viewerId: ctx.viewerId, viewId });
  }
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
