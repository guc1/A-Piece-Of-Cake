import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { canViewProfile } from '@/lib/visibility';
import { getViewContext, ViewContextProvider } from '@/lib/view-context';
import Link from 'next/link';

export default async function ViewAccountPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const [user] = await db
    .select({
      id: users.id,
      handle: users.handle,
      accountVisibility: users.accountVisibility,
    })
    .from(users)
    .where(eq(users.viewId, viewId));
  if (!user) notFound();

  const ctx = await getViewContext(user.id);
  const canView = await canViewProfile({
    viewerId: ctx.viewerId,
    targetUser: { id: user.id, accountVisibility: user.accountVisibility as any },
  });
  if (!canView) notFound();

  const viewerHandle = ctx.viewerId
    ? (
        await db
          .select({ handle: users.handle })
          .from(users)
          .where(eq(users.id, ctx.viewerId))
      )[0]?.handle
    : null;

  return (
    <ViewContextProvider value={ctx}>
      <section id={`v13wctx-${user.id}-${ctx.viewerId ?? 0}`} className="space-y-4">
        <div
          id={`v13wctx-bnr-${user.id}-${ctx.viewerId ?? 0}`}
          className="flex items-center justify-between bg-muted p-2 text-sm"
        >
          <span>Viewing @{user.handle} (read-only)</span>
          {viewerHandle && viewerHandle !== user.handle && (
            <Link href={`/u/${viewerHandle}`} className="underline">
              Back to your account
            </Link>
          )}
        </div>
        <Link href="/people" className="underline">
          Back to People
        </Link>
      </section>
    </ViewContextProvider>
  );
}
