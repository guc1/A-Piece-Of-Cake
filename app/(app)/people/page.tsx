import { db } from '@/lib/db';
import { follows, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { followRequest, unfollow, cancelFollowRequest } from './actions';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { eq, ne } from 'drizzle-orm';
import { Button } from '@/components/ui/button';

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user?.email) {
    return (
      <section>
        <h1 className="text-2xl font-bold">People</h1>
        <p>Please sign in.</p>
      </section>
    );
  }
  const self = await ensureUser(session);
  if (!params?.uid || Number(params.uid) !== self.id) {
    redirect(`/people?uid=${self.id}`);
  }
  const me = self.id;

  type DBUser = {
    id: number;
    handle: string;
    displayName: string | null;
    accountVisibility: string;
    viewId: string;
  };
  const allUsers: DBUser[] = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      accountVisibility: users.accountVisibility,
      viewId: users.viewId,
    })
    .from(users)
    .where(ne(users.id, me));

  const myFollows = await db
    .select({ followingId: follows.followingId, status: follows.status })
    .from(follows)
    .where(eq(follows.followerId, me));

  const inboundFollows = await db
    .select({ followerId: follows.followerId, status: follows.status })
    .from(follows)
    .where(eq(follows.followingId, me));

  const myMap = new Map(myFollows.map((f) => [f.followingId, f.status]));
  const inboundMap = new Map(
    inboundFollows.map((f) => [f.followerId, f.status]),
  );

  const friends: UserInfo[] = [];
  const following: (UserInfo & { status?: string })[] = [];
  const discover: (UserInfo & { status?: string })[] = [];

  for (const u of allUsers) {
    if (u.accountVisibility === 'private') continue;
    const myStatus = myMap.get(u.id);
    const theirStatus = inboundMap.get(u.id);
    const canView = u.accountVisibility === 'open' || myStatus === 'accepted';
    if (myStatus === 'accepted' && theirStatus === 'accepted') {
      friends.push({ ...u, canView });
    } else if (myStatus === 'accepted' || myStatus === 'pending') {
      following.push({ ...u, status: myStatus, canView });
    } else {
      discover.push({ ...u, status: theirStatus, canView });
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">People</h1>
        <Link href="/people/inbox" className="text-sm underline">
          Inbox
        </Link>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Friends</h2>
        <UserList viewerId={me} users={friends} relation="friend" />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Following</h2>
        <UserList viewerId={me} users={following} relation="following" />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Discover</h2>
        <UserList viewerId={me} users={discover} relation="discover" />
      </div>
    </section>
  );
}

interface UserInfo {
  id: number;
  handle: string;
  displayName: string | null;
  accountVisibility: string;
  viewId: string;
  canView: boolean;
}

function UserList({
  viewerId,
  users,
  relation,
}: {
  viewerId: number;
  users: (UserInfo & { status?: string })[];
  relation: 'friend' | 'following' | 'discover';
}) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users.</p>;
  }
  return (
    <ul className="divide-y">
      {users.map((u) => (
        <li key={u.id} className="flex items-center justify-between py-2">
          <div>
            <Link href={`/u/${u.handle}`} className="font-semibold">
              {u.displayName ?? u.handle}
            </Link>
            <div className="text-sm text-muted-foreground">@{u.handle}</div>
          </div>
          <UserAction viewerId={viewerId} user={u} relation={relation} />
        </li>
      ))}
    </ul>
  );
}

function UserAction({
  viewerId,
  user,
  relation,
}: {
  viewerId: number;
  user: UserInfo & { status?: string };
  relation: 'friend' | 'following' | 'discover';
}) {
  switch (relation) {
    case 'friend':
    case 'following':
      if (user.status === 'pending') {
        return (
          <div className="flex gap-2">
            <form action={cancelFollowRequest.bind(null, user.id)}>
              <Button
                id={`p30pl3-ccl-${user.id}-${viewerId}`}
                variant="outline"
                size="sm"
              >
                Requested
              </Button>
            </form>
          </div>
        );
      }
      return (
        <div className="flex gap-2">
          <form action={unfollow.bind(null, user.id)}>
            <Button
              id={`p30pl3-unf-${user.id}-${viewerId}`}
              variant="outline"
              size="sm"
            >
              Unfollow
            </Button>
          </form>
          {user.canView && (
            <Link
              id={`p30pl3-view-${user.id}-${viewerId}`}
              href={`/view/${user.viewId}`}
              className="text-sm underline"
              aria-label={`View @${user.handle}'s account (read-only)`}
            >
              View
            </Link>
          )}
        </div>
      );
    case 'discover':
      if (user.status === 'accepted') {
        return (
          <div className="flex gap-2">
            <form action={followRequest.bind(null, user.id)}>
              <Button id={`p30pl3-fol-${user.id}-${viewerId}`} size="sm">
                Follow back
              </Button>
            </form>
            {user.canView && (
              <Link
                id={`p30pl3-view-${user.id}-${viewerId}`}
                href={`/view/${user.viewId}`}
                className="text-sm underline"
                aria-label={`View @${user.handle}'s account (read-only)`}
              >
                View
              </Link>
            )}
          </div>
        );
      }
      return (
        <div className="flex gap-2">
          <form action={followRequest.bind(null, user.id)}>
            <Button id={`p30pl3-fol-${user.id}-${viewerId}`} size="sm">
              {user.accountVisibility === 'open'
                ? 'Follow'
                : 'Request to follow'}
            </Button>
          </form>
          {user.canView && (
            <Link
              id={`p30pl3-view-${user.id}-${viewerId}`}
              href={`/view/${user.viewId}`}
              className="text-sm underline"
              aria-label={`View @${user.handle}'s account (read-only)`}
            >
              View
            </Link>
          )}
        </div>
      );
    default:
      return null;
  }
}
