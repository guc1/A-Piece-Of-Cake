import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { COACH_TONES } from '@/lib/ai/coach-tone';

export async function GET() {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = self.id;
  const [user] = await db
    .select({ coachTone: users.coachTone })
    .from(users)
    .where(eq(users.id, userId));
  return NextResponse.json({ coachTone: user?.coachTone ?? 'tone_medium' });
}

export async function POST(req: Request) {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = self.id;
  const body = await req.json();
  const toneId = typeof body.coachTone === 'string' ? body.coachTone : '';
  if (!COACH_TONES.some((t) => t.id === toneId)) {
    return NextResponse.json({ error: 'Invalid coach tone' }, { status: 400 });
  }
  await db
    .update(users)
    .set({ coachTone: toneId, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return NextResponse.json({ coachTone: toneId });
}
