import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ensureUser } from '@/lib/users';
import type { CoachToneId } from '@/lib/ai/coach-tone';

const tones: CoachToneId[] = [
  'tone_soft',
  'tone_medium',
  'tone_hard',
  'tone_superhard',
];

export async function GET() {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = self.id;
  const [user] = await db
    .select({ coachTone: users.coachTone })
    .from(users)
    .where(eq(users.id, userId));
  return NextResponse.json({
    coachTone: (user?.coachTone as CoachToneId) ?? 'tone_medium',
  });
}

export async function POST(req: Request) {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = self.id;
  const body = await req.json();
  const tone = tones.includes(body.coachTone)
    ? (body.coachTone as CoachToneId)
    : null;
  if (!tone) {
    return NextResponse.json({ error: 'Invalid tone' }, { status: 400 });
  }
  await db
    .update(users)
    .set({ coachTone: tone, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return NextResponse.json({ coachTone: tone });
}
