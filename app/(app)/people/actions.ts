'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { follows, notifications, users } from '@/lib/db/schema';
import { createUser, getUserByHandle } from '@/lib/users';
import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

export async function followRequest(
  targetId: number,
  _formData?: FormData,
): Promise<void> {
  const session = await auth();
  let me = Number(session?.user?.id);
  if (!me) throw new Error('Please sign in.');
  if (me === targetId) throw new Error('Cannot follow yourself.');

  // Ensure the current user exists to avoid foreign key issues
  let [self] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, me));
  if (!self) {
    const email = session?.user?.email;
    if (!email) throw new Error('User not found');
    // derive a handle from the email and ensure uniqueness
    let baseHandle = email.split('@')[0];
    let handle = baseHandle;
    let suffix = 1;
    while (await getUserByHandle(handle)) {
      handle = `${baseHandle}${suffix++}`;
    }
    const password = randomBytes(16).toString('hex');
    const user = await createUser({
      email,
      password,
      handle,
      displayName: session?.user?.name ?? undefined,
    });
    me = user.id;
    self = { id: user.id };
  }

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
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) throw new Error('Please sign in.');
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
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) throw new Error('Please sign in.');
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
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) throw new Error('Please sign in.');
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, me), eq(follows.followingId, targetId)));
  revalidatePath('/people');
}

export async function declineFollowRequest(
  requesterId: number,
  _formData?: FormData,
): Promise<void> {
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) throw new Error('Please sign in.');
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
