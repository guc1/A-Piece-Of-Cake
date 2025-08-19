import { db } from '@/lib/db';
import { flavors, subflavors, userIcons } from '@/lib/db/schema';
import { and, eq, ne } from 'drizzle-orm';

// Return icons saved in a user's My Icons. If none exist, fall back to
// public icons used by their flavors and subflavors.
export async function listUserIcons(userId: number): Promise<string[]> {
  const rows = await db
    .select({ icon: userIcons.icon })
    .from(userIcons)
    .where(eq(userIcons.userId, userId));
  if (rows.length > 0) {
    return rows.map((r) => r.icon);
  }

  const flavorRows = await db
    .select({ icon: flavors.icon, visibility: flavors.visibility })
    .from(flavors)
    .where(and(eq(flavors.userId, userId), ne(flavors.visibility, 'private')));

  const subRows = await db
    .select({ icon: subflavors.icon, visibility: subflavors.visibility })
    .from(subflavors)
    .where(and(eq(subflavors.userId, userId), ne(subflavors.visibility, 'private')));

  const set = new Set<string>();
  for (const r of flavorRows) if (r.icon) set.add(r.icon);
  for (const r of subRows) if (r.icon) set.add(r.icon);
  return Array.from(set);
}

// Replace a user's My Icons with the provided list.
export async function setUserIcons(
  userId: number,
  icons: string[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(userIcons).where(eq(userIcons.userId, userId));
    if (icons.length > 0) {
      await tx.insert(userIcons).values(
        icons.map((icon) => ({ userId, icon })),
      );
    }
  });
}
