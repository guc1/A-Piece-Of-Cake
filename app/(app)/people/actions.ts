'use server';

import { db } from '@/lib/db';
import { follows, notifications, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { assertOwner } from '@/lib/profile';

export async function followRequest(
  boundOwnerId: number,
  targetId: number,
  _formData?: FormData,
): Promise<void> {
  await assertOwner(boundOwnerId);
  const me = boundOwnerId;
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
  } else {
    await db.insert(notifications).values([
      {
        toUserId: targetId,
        fromUserId: me,
        type: 'follow_request',
      },
      {
        toUserId: me,
        fromUserId: targetId,
        type: 'follow_accepted',
      },
    ]);
  }

  revalidatePath('/people');
  revalidatePath('/people/inbox');
}

export async function cancelFollowRequest(
  boundOwnerId: number,
  targetId: number,
  _formData?: FormData,
): Promise<void> {
  await assertOwner(boundOwnerId);
  const me = boundOwnerId;
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
  revalidatePath('/people/inbox');
}

export async function acceptFollowRequest(
  boundOwnerId: number,
  requesterId: number,
  _formData?: FormData,
): Promise<void> {
  await assertOwner(boundOwnerId);
  const me = boundOwnerId;
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
  revalidatePath('/people/inbox');
}

export async function unfollow(
  boundOwnerId: number,
  targetId: number,
  _formData?: FormData,
): Promise<void> {
  await assertOwner(boundOwnerId);
  const me = boundOwnerId;
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, me), eq(follows.followingId, targetId)));

  await db.insert(notifications).values({
    toUserId: targetId,
    fromUserId: me,
    type: 'unfollow',
  });
  revalidatePath('/people');
  revalidatePath('/people/inbox');
}

export async function declineFollowRequest(
  boundOwnerId: number,
  requesterId: number,
  _formData?: FormData,
): Promise<void> {
  await assertOwner(boundOwnerId);
  const me = boundOwnerId;
  await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, requesterId),
        eq(follows.followingId, me),
        eq(follows.status, 'pending'),
      ),
    );
  await db.insert(notifications).values({
    toUserId: requesterId,
    fromUserId: me,
    type: 'follow_declined',
  });
  revalidatePath('/people');
  revalidatePath('/people/inbox');
}
