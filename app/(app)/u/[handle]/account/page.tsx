import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, follows } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
    <div className="relative">
      <div className="fixed left-4 top-4 z-50 flex gap-2">
        <Button variant="outline" disabled>
          Viewer
        </Button>
        <Link href="/">
          <Button variant="outline">Exit</Button>
        </Link>
      </div>
      <CakeNavigation userId={user.id} readOnly />
    </div>
  );
}
