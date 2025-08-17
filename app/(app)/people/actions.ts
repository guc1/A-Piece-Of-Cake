'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { follows, notifications, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Retrieve the current user's id from the session and ensure a matching
 * database record exists. This guards against scenarios where a stale session
 * contains an id that no longer exists in the `users` table (e.g. after the
 * database is reset) which would otherwise cause foreign key violations when
 * inserting follow rows.
 */
async function getCurrentUserId(): Promise<number> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error('Please sign in.');

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (!user) throw new Error('User not found');
  return user.id;
}

export async function followRequest(
  targetId: number,
  _formData?: FormData,
): Promise<void> {
  const me = await getCurrentUserId();
  if (me === targetId) throw new Error('Cannot follow yourself.');

  const [target] = await db
    .select({ accountVisibility: users.accountVisibility })
    .from(users)
    .where(eq(users.id, targetId));
  if (!target) throw new Error('User not found');
  if (target.accountVisibility === 'private') {
    throw new Error('User is private');
  }

  const status = target.accountVisibility === 'open' ? 'accepted' : 'pending';

  await db
    .insert(follows)
    .values({ followerId: me, followingId: targetId, status })
    .onConflictDoUpdate({
      target: [follows.followerId, follows.followingId],
      set: { status, updatedAt: new Date() },
    });

  if (status === 'pending') {
    await db.insert(notifications).values({
      toUserId: targetId,
      fromUserId: me,
      type: 'follow_request',
    });
  }

  revalidatePath('/people');
}

export async function cancelFollowRequest(
  targetId: number,
  _formData?: FormData,
): Promise<void> {
  const me = await getCurrentUserId();
  await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, me),
        eq(follows.followingId, targetId),
        eq(follows.status, 'pending'),
      ),
    );
  revalidatePath('/people');
}

export async function acceptFollowRequest(
  requesterId: number,
  _formData?: FormData,
): Promise<void> {
  const me = await getCurrentUserId();
  const [req] = await db
    .select()
    .from(follows)
    .where(
      and(eq(follows.followerId, requesterId), eq(follows.followingId, me)),
    );
  if (!req || req.status !== 'pending') throw new Error('Request not found');
  await db
    .update(follows)
    .set({ status: 'accepted', updatedAt: new Date() })
    .where(eq(follows.id, req.id));
  await db.insert(notifications).values({
    toUserId: requesterId,
    fromUserId: me,
    type: 'follow_accepted',
  });
  revalidatePath('/people');
}

export async function unfollow(
  targetId: number,
  _formData?: FormData,
): Promise<void> {
  const me = await getCurrentUserId();
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, me), eq(follows.followingId, targetId)));
  revalidatePath('/people');
}

export async function declineFollowRequest(
  requesterId: number,
  _formData?: FormData,
): Promise<void> {
  const me = await getCurrentUserId();
  await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, requesterId),
        eq(follows.followingId, me),
        eq(follows.status, 'pending'),
      ),
    );
  revalidatePath('/people');
}
