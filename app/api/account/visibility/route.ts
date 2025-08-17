import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  const id = session?.user?.id ? Number(session.user.id) : null;
  if (!id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [user] = await db
    .select({ accountVisibility: users.accountVisibility })
    .from(users)
    .where(eq(users.id, id));
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ accountVisibility: user.accountVisibility });
}

export async function POST(req: Request) {
  const session = await auth();
  const id = session?.user?.id ? Number(session.user.id) : null;
  if (!id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { accountVisibility } = await req.json();
  if (!['open', 'closed', 'private'].includes(accountVisibility)) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }
  await db.update(users).set({ accountVisibility }).where(eq(users.id, id));
  return NextResponse.json({ accountVisibility });
}
