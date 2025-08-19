import { db } from '@/lib/db';
import { userIcons } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function listUserIcons(userId: number): Promise<string[]> {
  const rows = await db
    .select({ icon: userIcons.icon })
    .from(userIcons)
    .where(eq(userIcons.userId, userId));
  return rows.map((r) => r.icon);
}

export async function saveUserIcon(userId: number, icon: string) {
  await db
    .insert(userIcons)
    .values({ userId, icon })
    .onConflictDoNothing({
      target: [userIcons.userId, userIcons.icon],
    });
}

export async function deleteUserIcon(userId: number, icon: string) {
  await db
    .delete(userIcons)
    .where(and(eq(userIcons.userId, userId), eq(userIcons.icon, icon)));
}
