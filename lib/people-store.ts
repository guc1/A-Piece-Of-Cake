import { db } from '@/lib/db';
import { users, follows } from '@/lib/db/schema';
import { eq, ne } from 'drizzle-orm';

export interface Person {
  id: number;
  handle: string;
  displayName: string | null;
  viewId: string;
}

export interface PeopleLists {
  friends: Person[];
  following: Person[];
  others: Person[];
}

// Fetch friends, following, and others for the owner. Simplified version
// of the logic used on the People page. Private accounts are excluded.
export async function listPeople(ownerId: number): Promise<PeopleLists> {
  const all = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      accountVisibility: users.accountVisibility,
      viewId: users.viewId,
    })
    .from(users)
    .where(ne(users.id, ownerId));

  const outFollows = await db
    .select({ followingId: follows.followingId, status: follows.status })
    .from(follows)
    .where(eq(follows.followerId, ownerId));

  const inFollows = await db
    .select({ followerId: follows.followerId, status: follows.status })
    .from(follows)
    .where(eq(follows.followingId, ownerId));

  const outMap = new Map(outFollows.map((f) => [f.followingId, f.status]));
  const inMap = new Map(inFollows.map((f) => [f.followerId, f.status]));

  const friends: Person[] = [];
  const following: Person[] = [];
  const others: Person[] = [];

  for (const u of all) {
    if (u.accountVisibility === 'private') continue;
    const outStatus = outMap.get(u.id);
    const inStatus = inMap.get(u.id);
    const entry: Person = {
      id: u.id,
      handle: u.handle,
      displayName: u.displayName,
      viewId: u.viewId,
    };
    if (outStatus === 'accepted' && inStatus === 'accepted') {
      friends.push(entry);
    } else if (outStatus === 'accepted' || outStatus === 'pending') {
      following.push(entry);
    } else {
      others.push(entry);
    }
  }

  return { friends, following, others };
}
