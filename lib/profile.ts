import { db } from './db';
import { follows } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from './auth';

export interface ViewContext {
  ownerId: number;
  viewerId: number | null;
  viewId?: string;
  mode: 'owner' | 'viewer' | 'historical';
  snapshotDate?: string;
  editable: boolean;
}

export function buildViewContext({
  ownerId,
  viewerId,
  mode,
  viewId,
  snapshotDate,
}: {
  ownerId: number;
  viewerId: number | null;
  mode: 'owner' | 'viewer' | 'historical';
  viewId?: string;
  snapshotDate?: string;
}): ViewContext {
  return {
    ownerId,
    viewerId,
    viewId,
    mode,
    snapshotDate,
    editable: mode === 'owner',
  };
}

export async function canViewProfile({
  viewerId,
  targetUser,
}: {
  viewerId: number | null;
  targetUser: { id: number; accountVisibility: 'open' | 'closed' | 'private' };
}) {
  if (viewerId === targetUser.id) return true;
  switch (targetUser.accountVisibility) {
    case 'open':
      return true;
    case 'closed':
      if (!viewerId) return false;
      const [f] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, viewerId),
            eq(follows.followingId, targetUser.id),
          ),
        );
      return f?.status === 'accepted';
    case 'private':
      return false;
    default:
      return false;
  }
}

export async function assertOwner(
  ownerId: number,
  viewerId?: number | null,
) {
  const me =
    viewerId !== undefined && viewerId !== null
      ? viewerId
      : Number((await auth())?.user?.id);
  if (me !== ownerId) {
    throw new Error("Read-only: cannot edit another user's account.");
  }
}
