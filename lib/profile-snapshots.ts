import { db } from './db';
import { profileSnapshots, users, flavors, subflavors } from './db/schema';
import { eq, and, desc } from 'drizzle-orm';

function toISODate(d: Date) {
  // Convert to local ISO date (YYYY-MM-DD) ignoring timezone shifts
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

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
  await db
    .insert(profileSnapshots)
    .values({
      userId,
      snapshotDate,
      data: { user, flavors: flavorRows, subflavors: subflavorRows },
    })
    .onConflictDoNothing();
}

export async function ensureDailyProfileSnapshot(userId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const iso = toISODate(today);
  const existing = await db
    .select({ id: profileSnapshots.id })
    .from(profileSnapshots)
    .where(
      and(
        eq(profileSnapshots.userId, userId),
        eq(profileSnapshots.snapshotDate, iso),
      ),
    );
  if (existing.length === 0) {
    await createProfileSnapshot(userId, iso);
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
