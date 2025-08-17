import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { follows } from '@/lib/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { ensureUser } from '@/lib/users';

export async function GET() {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = self.id;
  const [row] = await db
    .select({ count: count() })
    .from(follows)
    .where(and(eq(follows.followingId, userId), eq(follows.status, 'accepted')));
  return NextResponse.json({ count: row?.count ?? 0 });
}
