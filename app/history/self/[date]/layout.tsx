import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { AppNav } from '@/components/app-nav';
import { ViewerBar } from '@/components/viewer-bar';

export default async function HistoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const session = await auth();
  if (!session) redirect('/');
  const me = await ensureUser(session);
  const ctx = buildViewContext({
    ownerId: me.id,
    viewerId: me.id,
    mode: 'historical',
    viewId: me.viewId,
    snapshotDate: date,
  });
  return (
    <html lang="en">
      <body>
        <ViewContextProvider value={ctx}>
          <AppNav />
          <main className="p-4">
            <div id={`v13wctx-${ctx.ownerId}-${ctx.viewerId}`}>{children}</div>
          </main>
          <ViewerBar />
        </ViewContextProvider>
      </body>
    </html>
  );
}
