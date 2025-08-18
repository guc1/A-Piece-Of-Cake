import { db } from './db';
import { users, flavors, subflavors, profileSnapshots } from './db/schema';
import { eq, and } from 'drizzle-orm';

export interface ProfileSnapshotData {
  user: {
    id: number;
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
    accountVisibility: string;
    viewId: string;
  };
  flavors: any[];
  subflavors: any[];
}

export async function createProfileSnapshot(userId: number, date: Date) {
  const [user] = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      accountVisibility: users.accountVisibility,
      viewId: users.viewId,
    })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) return;

  const flavorRows = await db
    .select()
    .from(flavors)
    .where(eq(flavors.userId, userId));
  const subRows = await db
    .select()
    .from(subflavors)
    .where(eq(subflavors.userId, userId));

  const data: ProfileSnapshotData = {
    user,
    flavors: flavorRows,
    subflavors: subRows,
  };

  const iso = date.toISOString().slice(0, 10);
  await db
    .insert(profileSnapshots)
    .values({
      userId,
      snapshotDate: iso,
      data: data as any,
    })
    .onConflictDoNothing({
      target: [profileSnapshots.userId, profileSnapshots.snapshotDate],
    });
}

export async function getProfileSnapshot(
  userId: number,
  date: Date,
): Promise<ProfileSnapshotData | null> {
  const iso = date.toISOString().slice(0, 10);
  const [row] = await db
    .select({ data: profileSnapshots.data })
    .from(profileSnapshots)
    .where(
      and(
        eq(profileSnapshots.userId, userId),
        eq(profileSnapshots.snapshotDate, iso),
      ),
    );
  return (row?.data as ProfileSnapshotData) ?? null;
}

export async function listSnapshotDates(userId: number): Promise<string[]> {
  const rows = await db
    .select({ date: profileSnapshots.snapshotDate })
    .from(profileSnapshots)
    .where(eq(profileSnapshots.userId, userId))
    .orderBy(profileSnapshots.snapshotDate);
  return rows.map((r) => r.date);
}
