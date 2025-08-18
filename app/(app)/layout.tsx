import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { AppNav } from '@/components/app-nav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect('/');
  const me = await ensureUser(session);
  const ctx = buildViewContext('owner', me.id, me.id);
  if (process.env.NODE_ENV !== 'production') {
    console.log({ pathname: '/', mode: ctx.mode, ownerId: ctx.ownerId, viewerId: ctx.viewerId });
  }
  return (
    <html lang="en">
      <body>
        <ViewContextProvider value={ctx}>
          <AppNav />
          <main className="p-4">
            <div id={`v13wctx-${ctx.ownerId}-${ctx.viewerId || 0}`}>{children}</div>
          </main>
        </ViewContextProvider>
      </body>
    </html>
  );
}
