import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, follows } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ViewerBanner } from '@/components/viewer-banner';
import { CakeNavigation } from '@/components/cake/cake-navigation';

export default async function ViewAccountPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const session = await auth();
  const viewerId = Number(session?.user?.id);
  const { handle } = await params;

  const [user] = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      accountVisibility: users.accountVisibility,
    })
    .from(users)
    .where(eq(users.handle, handle));

  if (!user) notFound();

  if (user.accountVisibility === 'private' && viewerId !== user.id) {
    notFound();
  }

  let relation: 'self' | 'accepted' | 'pending' | 'none' = 'none';
  if (viewerId) {
    if (viewerId === user.id) {
      relation = 'self';
    } else {
      const [outgoing] = await db
        .select()
        .from(follows)
        .where(
          and(eq(follows.followerId, viewerId), eq(follows.followingId, user.id)),
        );
      if (outgoing) relation = outgoing.status as 'accepted' | 'pending';
    }
  }

  if (
    user.accountVisibility === 'closed' &&
    viewerId !== user.id &&
    relation !== 'accepted'
  ) {
    notFound();
  }

  return (
    <section className="relative w-full">
      <h1 className="sr-only">{user.displayName ?? user.handle}</h1>
      <ViewerBanner exitHref="/" />
      <CakeNavigation userId={user.id} />
    </section>
  );
}
