import { db } from '@/lib/db';
import { follows, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { followRequest, unfollow, cancelFollowRequest } from './actions';
import Link from 'next/link';
import { eq, ne } from 'drizzle-orm';
import { Button } from '@/components/ui/button';

export default async function PeoplePage() {
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) {
    return (
      <section>
        <h1 className="text-2xl font-bold">People</h1>
        <p>Please sign in.</p>
      </section>
    );
  }

  const allUsers = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      accountVisibility: users.accountVisibility,
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

  const friends: typeof allUsers = [];
  const followersList: typeof allUsers = [];
  const discover: ((typeof allUsers)[number] & { status?: string })[] = [];

  for (const u of allUsers) {
    if (u.accountVisibility === 'private') continue;
    const myStatus = myMap.get(u.id);
    const theirStatus = inboundMap.get(u.id);
    if (
      u.accountVisibility !== 'open' &&
      myStatus !== 'accepted' &&
      theirStatus !== 'accepted'
    ) {
      continue;
    }
    if (myStatus === 'accepted' && theirStatus === 'accepted') {
      friends.push(u);
    } else if (myStatus === 'accepted' && theirStatus !== 'accepted') {
      followersList.push(u);
    } else if (myStatus === 'pending') {
      discover.push({ ...u, status: 'pending' });
    } else if (!myStatus && !theirStatus) {
      discover.push(u);
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
        <UserList users={friends} relation="friend" />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Followers</h2>
        <UserList users={followersList} relation="following" />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Discover</h2>
        <UserList users={discover} relation="discover" />
      </div>
    </section>
  );
}

interface UserInfo {
  id: number;
  handle: string;
  displayName: string | null;
  accountVisibility: string;
}

function UserList({
  users,
  relation,
}: {
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
          <UserAction user={u} relation={relation} />
        </li>
      ))}
    </ul>
  );
}

function UserAction({
  user,
  relation,
}: {
  user: UserInfo & { status?: string };
  relation: 'friend' | 'following' | 'discover';
}) {
  switch (relation) {
    case 'friend':
    case 'following':
      return (
        <form action={unfollow.bind(null, user.id)}>
          <Button variant="outline" size="sm">
            Unfollow
          </Button>
        </form>
      );
    case 'discover':
      if (user.status === 'pending') {
        return (
          <form action={cancelFollowRequest.bind(null, user.id)}>
            <Button variant="outline" size="sm">
              Cancel request
            </Button>
          </form>
        );
      }
      return (
        <form action={followRequest.bind(null, user.id)}>
          <Button size="sm">
            {user.accountVisibility === 'open' ? 'Follow' : 'Request to follow'}
          </Button>
        </form>
      );
    default:
      return null;
  }
}
