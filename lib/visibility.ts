import { db } from '@/lib/db';
import { follows } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function canViewProfile({
  viewerId,
  targetUser,
}: {
  viewerId: number | null;
  targetUser: { id: number; accountVisibility: 'open' | 'closed' | 'private' };
}): Promise<boolean> {
  if (viewerId === targetUser.id) return true;
  switch (targetUser.accountVisibility) {
    case 'open':
      return true;
    case 'closed':
      if (!viewerId) return false;
      const [row] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, viewerId),
            eq(follows.followingId, targetUser.id),
            eq(follows.status, 'accepted')
          )
        );
      return !!row;
    case 'private':
      return false;
    default:
      return false;
  }
}
