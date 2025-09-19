import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  COACH_TONES,
  isCustomTone,
} from '@/lib/ai/coach-tone';

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
}

export async function GET() {
  const session = await auth();
  const self = await ensureUser(session);
  const userId = self.id;
  const [user] = await db
    .select({
      coachTone: users.coachTone,
      coachToneCustom: users.coachToneCustom,
    })
    .from(users)
    .where(eq(users.id, userId));
  return NextResponse.json({
    coachTone: user?.coachTone ?? 'tone_medium',
    customInstructions: user?.coachToneCustom ?? '',
  });
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
  const customInstructions =
    typeof body.customInstructions === 'string'
      ? body.customInstructions.trim()
      : '';
  const wordCount = countWords(customInstructions);
  if (wordCount > 250) {
    return NextResponse.json(
      { error: 'Custom coach instructions must be 250 words or fewer.' },
      { status: 400 },
    );
  }
  if (isCustomTone(toneId) && !customInstructions) {
    return NextResponse.json(
      { error: 'Please add custom instructions for your custom coach tone.' },
      { status: 400 },
    );
  }
  await db
    .update(users)
    .set({
      coachTone: toneId,
      coachToneCustom: customInstructions,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  return NextResponse.json({
    coachTone: toneId,
    customInstructions,
  });
}
