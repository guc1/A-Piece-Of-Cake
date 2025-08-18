import { db } from '@/lib/db';
import { users, follows } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import {
  followRequest,
  cancelFollowRequest,
  unfollow,
} from '../../people/actions';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { canViewProfile } from '@/lib/visibility';

export default async function ProfilePage({
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
      viewId: users.viewId,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.handle, handle));

  if (!user) notFound();

  const canView = await canViewProfile({
    viewerId,
    targetUser: { id: user.id, accountVisibility: user.accountVisibility as any },
  });

  let relation: 'self' | 'accepted' | 'pending' | 'none' = 'none';
  if (viewerId) {
    if (viewerId === user.id) {
      relation = 'self';
    } else {
      const [outgoing] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, viewerId),
            eq(follows.followingId, user.id),
          ),
        );
      if (outgoing) relation = outgoing.status as 'accepted' | 'pending';
    }
  }

  if (user.accountVisibility === 'private' && relation !== 'self') {
    notFound();
  }

  return (
    <section
      id={`pr0ovr-${user.id}-${viewerId ?? 0}`}
      className="space-y-4"
    >
      <h1 className="text-2xl font-bold">{user.displayName ?? user.handle}</h1>
      <p>@{user.handle}</p>
      <div className="flex gap-2">
        {relation === 'self' ? null : user.accountVisibility === 'open' ? (
          relation === 'accepted' ? (
            <form
              action={unfollow.bind(null, user.id)}
              id={`pr0ovr-unf-${user.id}-${viewerId ?? 0}`}
            >
              <Button variant="outline">Unfollow</Button>
            </form>
          ) : (
            <form
              action={followRequest.bind(null, user.id)}
              id={`pr0ovr-fol-${user.id}-${viewerId ?? 0}`}
            >
              <Button>Follow</Button>
            </form>
          )
        ) : user.accountVisibility === 'closed' ? (
          relation === 'accepted' ? (
            <form
              action={unfollow.bind(null, user.id)}
              id={`pr0ovr-unf-${user.id}-${viewerId ?? 0}`}
            >
              <Button variant="outline">Unfollow</Button>
            </form>
          ) : relation === 'pending' ? (
            <form
              action={cancelFollowRequest.bind(null, user.id)}
              id={`pr0ovr-ccl-${user.id}-${viewerId ?? 0}`}
            >
              <Button variant="outline">Requested</Button>
            </form>
          ) : (
            <form
              action={followRequest.bind(null, user.id)}
              id={`pr0ovr-req-${user.id}-${viewerId ?? 0}`}
            >
              <Button>Request to follow</Button>
            </form>
          )
        ) : null}
        {canView && (
          <Link
            href={`/view/${user.viewId}`}
            id={`pr0ovr-view-${user.id}-${viewerId ?? 0}`}
            aria-label={`View @${user.handle}'s account (read-only)`}
          >
            <Button variant="outline">View Account</Button>
          </Link>
        )}
      </div>
    </section>
  );
}
