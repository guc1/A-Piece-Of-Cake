import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ensureUser } from '@/lib/users';

export async function GET() {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = self.id;
  const [user] = await db
    .select({ accountVisibility: users.accountVisibility })
    .from(users)
    .where(eq(users.id, userId));
  return NextResponse.json({
    accountVisibility: user?.accountVisibility ?? 'open',
  });
}

export async function POST(req: Request) {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = self.id;
  const body = await req.json();
  const visibility = ['open', 'closed', 'private'].includes(body.accountVisibility)
    ? (body.accountVisibility as 'open' | 'closed' | 'private')
    : null;
  if (!visibility) {
    return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
  }
  await db
    .update(users)
    .set({ accountVisibility: visibility, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return NextResponse.json({ accountVisibility: visibility });
}
