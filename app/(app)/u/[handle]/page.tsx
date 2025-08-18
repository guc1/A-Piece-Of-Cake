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
import Image from 'next/image';
import Link from 'next/link';
import { canViewProfile } from '@/lib/profile';

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
      avatarUrl: users.avatarUrl,
      viewId: users.viewId,
    })
    .from(users)
    .where(eq(users.handle, handle));

  if (!user) notFound();

  if (user.accountVisibility === 'private' && viewerId !== user.id) {
    notFound();
  }

  let relation: 'self' | 'accepted' | 'pending' | 'none' = 'none';
  let inbound: 'accepted' | 'pending' | null = null;
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
      const [incoming] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, user.id),
            eq(follows.followingId, viewerId),
          ),
        );
      if (incoming) inbound = incoming.status as 'accepted' | 'pending';
    }
  }

  const canView = await canViewProfile({
    viewerId: viewerId || null,
    targetUser: {
      id: user.id,
      accountVisibility: user.accountVisibility as any,
    },
  });

  if (
    user.accountVisibility === 'closed' &&
    viewerId !== user.id &&
    relation !== 'accepted'
  ) {
    return (
      <section id={`pr0ovr-${user.id}-${viewerId || 0}`} className="space-y-4">
        <h1 className="text-2xl font-bold">
          {user.displayName ?? user.handle}
        </h1>
        <p>@{user.handle}</p>
        <div className="text-sm">Closed account</div>
        {relation === 'pending' ? (
          <form action={cancelFollowRequest.bind(null, user.id)}>
            <Button id={`pr0ovr-ccl-${user.id}-${viewerId}`} variant="outline">
              Requested
            </Button>
          </form>
        ) : (
          <form action={followRequest.bind(null, user.id)}>
            <Button id={`pr0ovr-req-${user.id}-${viewerId}`}>
              Request to follow
            </Button>
          </form>
        )}
      </section>
    );
  }

  return (
    <section id={`pr0ovr-${user.id}-${viewerId || 0}`} className="space-y-4">
      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt="avatar"
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : null}
        <div>
          <h1 className="text-2xl font-bold">
            {user.displayName ?? user.handle}
          </h1>
          <p>@{user.handle}</p>
          <div className="text-sm">{user.accountVisibility}</div>
        </div>
      </div>
      <div className="flex gap-2">
        {relation === 'self' ? null : relation === 'accepted' ? (
          <form action={unfollow.bind(null, user.id)}>
            <Button id={`pr0ovr-unf-${user.id}-${viewerId}`} variant="outline">
              Unfollow
            </Button>
          </form>
        ) : relation === 'pending' ? (
          <form action={cancelFollowRequest.bind(null, user.id)}>
            <Button id={`pr0ovr-ccl-${user.id}-${viewerId}`} variant="outline">
              Requested
            </Button>
          </form>
        ) : inbound === 'accepted' ? (
          <form action={followRequest.bind(null, user.id)}>
            <Button id={`pr0ovr-fol-${user.id}-${viewerId}`}>
              Follow back
            </Button>
          </form>
        ) : (
          <form action={followRequest.bind(null, user.id)}>
            <Button
              id={`pr0ovr-${user.accountVisibility === 'open' ? 'fol' : 'req'}-${user.id}-${viewerId}`}
            >
              {user.accountVisibility === 'open'
                ? 'Follow'
                : 'Request to follow'}
            </Button>
          </form>
        )}
        {canView && (
          <Link
            id={`pr0ovr-view-${user.id}-${viewerId || 0}`}
            href={`/view/${user.viewId}`}
            className="text-sm underline"
            aria-label={`View @${user.handle}'s account (read-only)`}
          >
            View Account
          </Link>
        )}
      </div>
    </section>
  );
}
