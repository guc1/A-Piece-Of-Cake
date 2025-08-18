import { db } from '@/lib/db';
import { follows, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { followRequest, unfollow, cancelFollowRequest } from './actions';
import { ensureUser, getUserByViewId } from '@/lib/users';
import Link from 'next/link';
import { eq, ne } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import { buildViewContext } from '@/lib/profile';
import { hrefFor } from '@/lib/navigation';
import { ViewLink } from '@/components/people/view-link';

export default async function PeoplePage({
  params,
}: {
  params?: { viewId?: string };
}) {
  const session = await auth();
  if (!session?.user?.email) {
    return (
      <section>
        <h1 className="text-2xl font-bold">People</h1>
        <p>Please sign in.</p>
      </section>
    );
  }
  const viewer = await ensureUser(session);
  let owner = viewer;
  if (params?.viewId) {
    const user = await getUserByViewId(params.viewId);
    if (!user) notFound();
    owner = user;
  }
  const ownerId = owner.id;
  const viewerId = viewer.id;

  const mode = ownerId === viewerId ? 'owner' : params?.viewId ? 'viewer' : 'owner';
  const ctx = buildViewContext({
    ownerId,
    viewerId,
    mode,
    viewId: owner.viewId,
  });

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
    .where(ne(users.id, ownerId));

  const ownerFollows = await db
    .select({ followingId: follows.followingId, status: follows.status })
    .from(follows)
    .where(eq(follows.followerId, ownerId));

  const ownerInbound = await db
    .select({ followerId: follows.followerId, status: follows.status })
    .from(follows)
    .where(eq(follows.followingId, ownerId));

  const ownerMap = new Map(ownerFollows.map((f) => [f.followingId, f.status]));
  const ownerInboundMap = new Map(
    ownerInbound.map((f) => [f.followerId, f.status]),
  );

  const viewerFollows = await db
    .select({ followingId: follows.followingId, status: follows.status })
    .from(follows)
    .where(eq(follows.followerId, viewerId));

  const viewerInbound = await db
    .select({ followerId: follows.followerId, status: follows.status })
    .from(follows)
    .where(eq(follows.followingId, viewerId));

  const viewerMap = new Map(
    viewerFollows.map((f) => [f.followingId, f.status]),
  );
  const viewerInboundMap = new Map(
    viewerInbound.map((f) => [f.followerId, f.status]),
  );

  const friends: UserInfo[] = [];
  const following: UserInfo[] = [];
  const discover: UserInfo[] = [];

  for (const u of allUsers) {
    if (u.accountVisibility === 'private') continue;
    const ownerStatus = ownerMap.get(u.id);
    const ownerInboundStatus = ownerInboundMap.get(u.id);
    const viewerStatus = viewerMap.get(u.id);
    const followsMe = viewerInboundMap.get(u.id) === 'accepted';
    const canView =
      u.accountVisibility === 'open' || viewerStatus === 'accepted';
    const entry = { ...u, canView, viewerStatus, followsMe };
    if (ownerStatus === 'accepted' && ownerInboundStatus === 'accepted') {
      friends.push(entry);
    } else if (ownerStatus === 'accepted' || ownerStatus === 'pending') {
      following.push(entry);
    } else {
      discover.push(entry);
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">People</h1>
        {ownerId === viewerId && (
          <Link href={hrefFor('/people/inbox', ctx)} className="text-sm underline">
            Inbox
          </Link>
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Friends</h2>
        <UserList viewerId={viewerId} users={friends} />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Following</h2>
        <UserList viewerId={viewerId} users={following} />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Discover</h2>
        <UserList viewerId={viewerId} users={discover} />
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
  viewerStatus?: string;
  followsMe?: boolean;
}

function UserList({
  viewerId,
  users,
}: {
  viewerId: number;
  users: UserInfo[];
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
          <UserAction viewerId={viewerId} user={u} />
        </li>
      ))}
    </ul>
  );
}

function UserAction({
  viewerId,
  user,
}: {
  viewerId: number;
  user: UserInfo;
}) {
  if (user.viewerStatus === 'pending') {
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
        {user.canView && (
          <ViewLink
            id={`p30pl3-view-${user.id}-${viewerId}`}
            href={`/view/${user.viewId}`}
            handle={user.handle}
          />
        )}
      </div>
    );
  }
  if (user.viewerStatus === 'accepted') {
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
          <ViewLink
            id={`p30pl3-view-${user.id}-${viewerId}`}
            href={`/view/${user.viewId}`}
            handle={user.handle}
          />
        )}
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <form action={followRequest.bind(null, user.id)}>
        <Button id={`p30pl3-fol-${user.id}-${viewerId}`} size="sm">
          {user.followsMe
            ? 'Follow back'
            : user.accountVisibility === 'open'
            ? 'Follow'
            : 'Request to follow'}
        </Button>
      </form>
      {user.canView && (
        <ViewLink
          id={`p30pl3-view-${user.id}-${viewerId}`}
          href={`/view/${user.viewId}`}
          handle={user.handle}
        />
      )}
    </div>
  );
}
