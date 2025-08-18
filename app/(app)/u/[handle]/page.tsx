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

  if (
    user.accountVisibility === 'closed' &&
    viewerId !== user.id &&
    relation !== 'accepted'
  ) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">
          {user.displayName ?? user.handle}
        </h1>
        <p>@{user.handle}</p>
        {relation === 'pending' ? (
          <form action={cancelFollowRequest.bind(null, user.id)}>
            <Button variant="outline">Requested</Button>
          </form>
        ) : (
          <form action={followRequest.bind(null, user.id)}>
            <Button>Request to follow</Button>
          </form>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{user.displayName ?? user.handle}</h1>
      <p>@{user.handle}</p>
      {relation === 'self' ? null : relation === 'accepted' ? (
        <form action={unfollow.bind(null, user.id)}>
          <Button variant="outline">Unfollow</Button>
        </form>
      ) : relation === 'pending' ? (
        <form action={cancelFollowRequest.bind(null, user.id)}>
          <Button variant="outline">Cancel request</Button>
        </form>
      ) : inbound === 'accepted' ? (
        <form action={followRequest.bind(null, user.id)}>
          <Button>Follow back</Button>
        </form>
      ) : (
        <form action={followRequest.bind(null, user.id)}>
          <Button>
            {user.accountVisibility === 'open' ? 'Follow' : 'Request to follow'}
          </Button>
        </form>
      )}
    </section>
  );
}
