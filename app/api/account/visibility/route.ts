import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [row] = await db
    .select({ accountVisibility: users.accountVisibility })
    .from(users)
    .where(eq(users.id, Number(userId)));
  return NextResponse.json({
    accountVisibility: row?.accountVisibility ?? 'open',
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const value = body?.accountVisibility;
  if (!['open', 'closed', 'private'].includes(value)) {
    return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
  }
  await db
    .update(users)
    .set({ accountVisibility: value, updatedAt: new Date() })
    .where(eq(users.id, Number(userId)));
  return NextResponse.json({ accountVisibility: value });
}
