import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { follows } from '@/lib/db/schema';
import { ensureUser } from '@/lib/users';
import { and, eq, sql } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = self.id;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(and(eq(follows.followingId, userId), eq(follows.status, 'accepted')));
  return NextResponse.json({ followers: row?.count ?? 0 });
}
