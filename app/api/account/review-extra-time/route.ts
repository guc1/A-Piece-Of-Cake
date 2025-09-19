import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureUser, getUserById } from '@/lib/users';
import { getUserTimeZone } from '@/lib/clock';
import {
  activateReviewExtraTime,
  getActiveReviewExtraTime,
  getReviewExtraTimeForDate,
} from '@/lib/review-extra-time-store';
import { canViewProfile } from '@/lib/profile';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ reviewExtraTime: null }, { status: 401 });
  }
  const me = await ensureUser(session);
  const userIdParam = Number(req.nextUrl.searchParams.get('userId'));
  const targetUserId = Number.isFinite(userIdParam) && userIdParam > 0 ? userIdParam : me.id;
  const snapshotDate = req.nextUrl.searchParams.get('snapshotDate') || undefined;
  if (targetUserId !== me.id) {
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ reviewExtraTime: null }, { status: 404 });
    }
    const allowed = await canViewProfile({
      viewerId: me.id,
      targetUser: {
        id: targetUser.id,
        accountVisibility: targetUser.accountVisibility as any,
      },
    });
    if (!allowed) {
      return NextResponse.json({ reviewExtraTime: null }, { status: 403 });
    }
  }
  try {
    const entry = snapshotDate
      ? await getReviewExtraTimeForDate(targetUserId, snapshotDate)
      : await getActiveReviewExtraTime(targetUserId);
    return NextResponse.json({ reviewExtraTime: entry });
  } catch (error) {
    console.error('review-extra-time GET failed', { error, targetUserId, snapshotDate });
    return NextResponse.json({ reviewExtraTime: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const me = await ensureUser(session);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const reason = typeof body.reason === 'string' ? body.reason : '';
  const tz = getUserTimeZone(me as any, {
    cookies: req.cookies,
    searchParams: Object.fromEntries(req.nextUrl.searchParams),
  });
  try {
    const record = await activateReviewExtraTime({
      userId: me.id,
      tz,
      reason,
    });
    return NextResponse.json({ reviewExtraTime: record });
  } catch (error) {
    console.error('review-extra-time POST failed', { error, userId: me.id });
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Unable to activate extra time.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
