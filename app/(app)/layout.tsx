import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { buildViewContext } from '@/lib/profile';
import { ensureDailyProfileSnapshot } from '@/lib/profile-snapshots';
import { getUserTimeZone } from '@/lib/clock';
import { ViewContextProvider } from '@/lib/view-context';
import { AppNav } from '@/components/app-nav';

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
  const tz = getUserTimeZone(me as any);
  await ensureDailyProfileSnapshot(me.id, tz);
  const ctx = buildViewContext({
    ownerId: me.id,
    viewerId: me.id,
    mode: 'owner',
    viewId: me.viewId,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log({
      mode: ctx.mode,
      ownerId: ctx.ownerId,
      viewerId: ctx.viewerId,
    });
  }

  return (
    <ViewContextProvider value={ctx}>
      <AppNav />
      <main className="p-4">
        <div id={`v13wctx-${ctx.ownerId}-${ctx.viewerId}`}>{children}</div>
      </main>
    </ViewContextProvider>
  );
}
