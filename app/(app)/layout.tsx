import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AppNav from '@/components/app-nav';
import { ensureUser } from '@/lib/users';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect('/');
  }
  const me = await ensureUser(session);
  const ctx = buildViewContext(me.id, me.viewId, me.id);

  return (
    <html lang="en">
      <body>
        <ViewContextProvider value={ctx}>
          <AppNav />
          <main className="p-4">{children}</main>
        </ViewContextProvider>
      </body>
    </html>
  );
}
