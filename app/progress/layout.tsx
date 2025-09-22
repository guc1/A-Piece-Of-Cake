import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { buildViewContext } from '@/lib/profile';
import { ensureDailyProfileSnapshot } from '@/lib/profile-snapshots';
import { ensureDailyProgressSnapshot } from '@/lib/progress-tracking-store';
import { getUserTimeZone } from '@/lib/clock';
import { cookies } from 'next/headers';
import { ViewContextProvider } from '@/lib/view-context';
import { AppNav } from '@/components/app-nav';

export default async function ProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect('/');
  }
  const me = await ensureUser(session);
  const cookieStore = await cookies();
  const tz = getUserTimeZone(me as any, { cookies: cookieStore });
  await ensureDailyProfileSnapshot(me.id, tz);
  await ensureDailyProgressSnapshot(me.id, tz);
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
      <div id={`v13wctx-${ctx.ownerId}-${ctx.viewerId}`}>{children}</div>
    </ViewContextProvider>
  );
}
