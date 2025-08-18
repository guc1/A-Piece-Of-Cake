import { db } from './db';
import { follows } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from './auth';

export interface ViewContext {
  ownerId: number;
  viewerId: number | null;
  viewId?: string;
  mode: 'owner' | 'viewer';
  editable: boolean;
}

export function buildViewContext(
  ownerId: number,
  viewerId: number | null,
  viewId?: string,
): ViewContext {
  const mode = viewerId === ownerId ? 'owner' : 'viewer';
  return { ownerId, viewerId, viewId, mode, editable: mode === 'owner' };
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

export function assertOwner(viewerId: number, ownerId: number) {
  if (viewerId !== ownerId) {
    throw new Error("Read-only: you cannot edit another user's account.");
  }
}
