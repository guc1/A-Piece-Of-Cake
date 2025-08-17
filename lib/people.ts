import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { follows, notifications, users } from '@/lib/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';

export interface SimpleUser {
  id: number;
  handle: string;
  displayName: string | null;
  accountVisibility: string;
}

export async function getFriends(userId: number): Promise<SimpleUser[]> {
  const res = await db.execute(
    sql`SELECT u.id, u.handle, u.display_name as "displayName", u.account_visibility as "accountVisibility"
        FROM users u
        JOIN follows f1 ON f1.following_id = u.id AND f1.follower_id = ${userId} AND f1.status = 'accepted'
        JOIN follows f2 ON f2.following_id = ${userId} AND f2.follower_id = u.id AND f2.status = 'accepted'
        WHERE u.account_visibility <> 'private'
        ORDER BY u.display_name NULLS LAST, u.handle`
  );
  return res.rows as any;
}

export async function getFollowers(userId: number): Promise<SimpleUser[]> {
  const res = await db.execute(
    sql`SELECT u.id, u.handle, u.display_name as "displayName", u.account_visibility as "accountVisibility"
        FROM users u
        JOIN follows f1 ON f1.following_id = u.id AND f1.follower_id = ${userId} AND f1.status = 'accepted'
        LEFT JOIN follows f2 ON f2.following_id = ${userId} AND f2.follower_id = u.id AND f2.status = 'accepted'
        WHERE f2.id IS NULL AND u.account_visibility <> 'private'
        ORDER BY u.display_name NULLS LAST, u.handle`
  );
  return res.rows as any;
}

export async function getDiscover(userId: number): Promise<SimpleUser[]> {
  const res = await db.execute(
    sql`SELECT u.id, u.handle, u.display_name as "displayName", u.account_visibility as "accountVisibility"
        FROM users u
        LEFT JOIN follows f1 ON f1.follower_id = ${userId} AND f1.following_id = u.id
        LEFT JOIN follows f2 ON f2.follower_id = u.id AND f2.following_id = ${userId} AND f2.status = 'accepted'
        WHERE u.id <> ${userId}
          AND u.account_visibility IN ('open','closed')
          AND f1.id IS NULL
          AND f2.id IS NULL
        ORDER BY u.display_name NULLS LAST, u.handle`
  );
  return res.rows as any;
}

export async function getInbox(userId: number) {
  const requests = await db.execute(
    sql`SELECT u.id, u.handle, u.display_name as "displayName", f.created_at as "createdAt"
        FROM users u
        JOIN follows f ON f.follower_id = u.id AND f.following_id = ${userId} AND f.status = 'pending'
        ORDER BY f.created_at DESC`
  );
  const activity = await db.execute(
    sql`SELECT n.id, u.handle, u.display_name as "displayName", n.created_at as "createdAt", n.read_at as "readAt"
        FROM notifications n
        JOIN users u ON u.id = n.from_user_id
        WHERE n.to_user_id = ${userId} AND n.type = 'follow_accepted'
        ORDER BY n.created_at DESC`
  );
  return { requests: requests.rows as any, activity: activity.rows as any };
}

export async function markAllActivityRead() {
  'use server';
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.toUserId, me), eq(notifications.type, 'follow_accepted'), isNull(notifications.readAt)));
}

export async function followRequest(targetId: number) {
  'use server';
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me || me === targetId) return;
  const [target] = await db
    .select({ id: users.id, accountVisibility: users.accountVisibility })
    .from(users)
    .where(eq(users.id, targetId));
  if (!target) return;
  if (target.accountVisibility === 'private') return;
  if (target.accountVisibility === 'open') {
    await db
      .insert(follows)
      .values({ followerId: me, followingId: targetId, status: 'accepted' })
      .onConflictDoUpdate({
        target: [follows.followerId, follows.followingId],
        set: { status: 'accepted', updatedAt: sql`now()` },
      });
  } else {
    await db
      .insert(follows)
      .values({ followerId: me, followingId: targetId, status: 'pending' })
      .onConflictDoUpdate({
        target: [follows.followerId, follows.followingId],
        set: { status: 'pending', updatedAt: sql`now()` },
      });
    await db.insert(notifications).values({ toUserId: targetId, fromUserId: me, type: 'follow_request' });
  }
}

export async function cancelFollowRequest(targetId: number) {
  'use server';
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) return;
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, me), eq(follows.followingId, targetId), eq(follows.status, 'pending')));
  await db
    .delete(notifications)
    .where(and(eq(notifications.toUserId, targetId), eq(notifications.fromUserId, me), eq(notifications.type, 'follow_request')));
}

export async function unfollow(targetId: number) {
  'use server';
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) return;
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, me), eq(follows.followingId, targetId)));
}

export async function acceptFollowRequest(requesterId: number) {
  'use server';
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) return;
  const updated = await db
    .update(follows)
    .set({ status: 'accepted', updatedAt: new Date() })
    .where(and(eq(follows.followerId, requesterId), eq(follows.followingId, me), eq(follows.status, 'pending')))
    .returning();
  if (updated.length) {
    await db.insert(notifications).values({ toUserId: requesterId, fromUserId: me, type: 'follow_accepted' });
  }
}

export async function declineFollowRequest(requesterId: number) {
  'use server';
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) return;
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, requesterId), eq(follows.followingId, me), eq(follows.status, 'pending')));
}
