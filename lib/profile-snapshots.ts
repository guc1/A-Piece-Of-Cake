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
  const icons = await listUserIcons(userId);
  await db
    .insert(profileSnapshots)
    .values({
      userId,
      snapshotDate,
      data: { user, flavors: flavorRows, subflavors: subflavorRows, icons },
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
