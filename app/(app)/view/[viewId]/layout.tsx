import { getUserByViewId } from '@/lib/users';
import { auth } from '@/lib/auth';
import { buildViewContext, canViewProfile } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import ViewerBar from '@/components/viewer-bar';
import { notFound } from 'next/navigation';

export default async function ViewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const session = await auth();
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const allowed = await canViewProfile({
    viewerId,
    targetUser: { id: user.id, accountVisibility: user.accountVisibility as any },
  });
  if (!allowed) notFound();
  const ctx = buildViewContext(user.id, user.viewId, viewerId);
  return (
    <ViewContextProvider value={ctx}>
      <div id={`v13wctx-${user.id}-${viewerId || 0}`} className="relative">
        {children}
        <ViewerBar />
      </div>
    </ViewContextProvider>
  );
}
