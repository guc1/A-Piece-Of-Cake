import { getUserByViewId, ensureUser } from '@/lib/users';
import { auth } from '@/lib/auth';
import { buildViewContext, canViewProfile } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ViewPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const session = await auth();
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  const viewer = viewerId ? await ensureUser(session) : null;
  const { viewId } = await params;
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
  const ctx = buildViewContext(user.id, viewerId);
  return (
    <ViewContextProvider value={ctx}>
      <section id={`v13wctx-${user.id}-${viewerId || 0}`} className="space-y-4">
        <div
          id={`v13wctx-bnr-${user.id}-${viewerId || 0}`}
          className="text-sm text-muted-foreground"
        >
          Viewing @{user.handle} (read-only)
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/people" className="underline">
            Back to People
          </Link>
          {viewer && (
            <Link href={`/u/${viewer.handle}`} className="underline">
              Your account
            </Link>
          )}
        </div>
      </section>
    </ViewContextProvider>
  );
}
