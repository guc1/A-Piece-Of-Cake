import { db } from '@/lib/db';
import { flavors, subflavors } from '@/lib/db/schema';
import { and, eq, ne } from 'drizzle-orm';

// Return unique public icons used by a user's flavors and subflavors.
export async function listUserIcons(userId: number): Promise<string[]> {
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
