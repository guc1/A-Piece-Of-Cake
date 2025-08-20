import { db } from './db';
import { profileSnapshots, users, flavors, subflavors } from './db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { startOfDay, addDays, toYMD } from './clock';
import { listUserIcons } from './icons-store';

export async function createProfileSnapshot(
  userId: number,
  snapshotDate: string,
) {
  const [user] = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      viewId: users.viewId,
      accountVisibility: users.accountVisibility,
    })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) return;
  const flavorRows = await db
    .select()
    .from(flavors)
    .where(eq(flavors.userId, userId));
  const subflavorRows = await db
    .select()
    .from(subflavors)
    .where(eq(subflavors.userId, userId));
  const iconList = await listUserIcons(userId);
  await db
    .insert(profileSnapshots)
    .values({
      userId,
      snapshotDate,
      data: {
        user,
        flavors: flavorRows,
        subflavors: subflavorRows,
        icons: iconList,
      },
    })
    .onConflictDoNothing();
}

export async function ensureDailyProfileSnapshot(userId: number, tz: string) {
  const today = startOfDay(new Date(), tz);
  const yesterday = addDays(today, -1, tz);
  const yIso = toYMD(yesterday, tz);
  const existing = await db
    .select({ id: profileSnapshots.id })
    .from(profileSnapshots)
    .where(
      and(
        eq(profileSnapshots.userId, userId),
        eq(profileSnapshots.snapshotDate, yIso),
      ),
    );
  if (existing.length === 0) {
    await createProfileSnapshot(userId, yIso);
  }
}

export async function listProfileSnapshotDates(
  userId: number,
): Promise<string[]> {
  const rows = await db
    .select({ snapshotDate: profileSnapshots.snapshotDate })
    .from(profileSnapshots)
    .where(eq(profileSnapshots.userId, userId))
    .orderBy(desc(profileSnapshots.snapshotDate));
  return rows.map((r) => r.snapshotDate);
}

export async function getProfileSnapshot(userId: number, snapshotDate: string) {
  const [row] = await db
    .select()
    .from(profileSnapshots)
    .where(
      and(
        eq(profileSnapshots.userId, userId),
        eq(profileSnapshots.snapshotDate, snapshotDate),
      ),
    );
  return row?.data as any;
}

// Derive the icon set from a profile snapshot. This helper allows older
// snapshots that predate explicit icon capture to still return the icons
// associated with flavors and subflavors from that day.
export function iconsFromSnapshot(snap: any): string[] {
  const set = new Set<string>();
  if (Array.isArray(snap?.icons)) {
    for (const ic of snap.icons) set.add(String(ic));
  }
  if (Array.isArray(snap?.flavors)) {
    for (const f of snap.flavors) {
      if (f.icon) set.add(String(f.icon));
    }
  }
  if (Array.isArray(snap?.subflavors)) {
    for (const sf of snap.subflavors) {
      if (sf.icon) set.add(String(sf.icon));
    }
  }
  return Array.from(set);
}
