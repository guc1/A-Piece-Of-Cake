import { db } from './db';
import { follows } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from './auth';

export interface ViewContext {
  ownerId: number;
  viewerId: number | null;
  mode: 'owner' | 'viewer';
  editable: boolean;
  viewId: string;
}

export function buildViewContext(
  ownerId: number,
  viewId: string,
  viewerId: number | null,
): ViewContext {
  const mode = viewerId === ownerId ? 'owner' : 'viewer';
  return { ownerId, viewerId, mode, editable: mode === 'owner', viewId };
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

export async function assertOwner(ownerId: number) {
  const session = await auth();
  const me = Number(session?.user?.id);
  if (me !== ownerId) {
    throw new Error("Read-only: you cannot edit another user's account.");
  }
}

export type Section =
  | 'cake'
  | 'planning'
  | 'flavors'
  | 'ingredients'
  | 'review'
  | 'people'
  | 'visibility';

export function getSectionHref(section: Section, ctx: ViewContext) {
  if (ctx.mode === 'viewer') {
    return `/view/${ctx.viewId}${section === 'cake' ? '' : `/${section}`}`;
  }
  return `/${section === 'cake' ? '' : section}`;
}
