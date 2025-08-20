import { db } from '@/lib/db';
import { flavors, subflavors, userIcons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Return all unique icons associated with a user. This includes icons
// from their flavors, subflavors, and any icons they've uploaded or
// imported into "My Icons". No visibility filters are applied so the
// list represents the full set of icons a user has.
export async function listUserIcons(userId: number): Promise<string[]> {
  const flavorRows = await db
    .select({ icon: flavors.icon })
    .from(flavors)
    .where(eq(flavors.userId, userId));

  const subRows = await db
    .select({ icon: subflavors.icon })
    .from(subflavors)
    .where(eq(subflavors.userId, userId));

  const userRows = await db
    .select({ icon: userIcons.icon })
    .from(userIcons)
    .where(eq(userIcons.userId, userId));

  const set = new Set<string>();
  for (const r of flavorRows) if (r.icon) set.add(r.icon);
  for (const r of subRows) if (r.icon) set.add(r.icon);
  for (const r of userRows) set.add(r.icon);
  return Array.from(set);
}

// Retrieve the current user's saved "My Icons" list.
export async function getMyIcons(userId: number): Promise<string[]> {
  const rows = await db
    .select({ icon: userIcons.icon })
    .from(userIcons)
    .where(eq(userIcons.userId, userId));
  return rows.map((r) => r.icon);
}

// Replace the current user's "My Icons" list with the provided icons.
// This simple approach keeps the client and server in sync.
export async function saveMyIcons(userId: number, icons: string[]) {
  await db.delete(userIcons).where(eq(userIcons.userId, userId));
  const unique = Array.from(new Set(icons));
  if (unique.length > 0) {
    await db.insert(userIcons).values(unique.map((icon) => ({ userId, icon })));
  }
}
