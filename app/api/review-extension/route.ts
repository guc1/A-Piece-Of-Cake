import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { canViewProfile } from '@/lib/profile';
import {
  getReviewExtensionForDate,
  getActiveReviewExtension,
  upsertReviewExtension,
} from '@/lib/review-extension-store';
import {
  addDays,
  getNow,
  getUserTimeZone,
  startOfDay,
  toYMD,
  type ReqInit,
} from '@/lib/clock';

function buildReqInit(req: NextRequest): ReqInit {
  return {
    cookies: req.cookies,
    searchParams: Object.fromEntries(req.nextUrl.searchParams),
  };
}

function responseFromRecord(
  record:
    | Awaited<ReturnType<typeof getActiveReviewExtension>>
    | Awaited<ReturnType<typeof getReviewExtensionForDate>>,
  mode: 'current' | 'historical',
  active: boolean,
) {
  if (!record) return { visible: false };
  return {
    visible: true,
    mode,
    extension: {
      reason: record.reason,
      targetDate: record.targetDate,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      active,
    },
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  const search = req.nextUrl.searchParams;
  const userIdParam = search.get('userId');
  const targetUserId = userIdParam ? Number(userIdParam) : viewerId;
  if (!targetUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [target] = await db
    .select({
      id: users.id,
      accountVisibility: users.accountVisibility,
    })
    .from(users)
    .where(eq(users.id, targetUserId));
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (viewerId !== targetUserId) {
    const allowed = await canViewProfile({
      viewerId,
      targetUser: {
        id: target.id,
        accountVisibility: target.accountVisibility as any,
      },
    });
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  const reqInit = buildReqInit(req);
  const tz = getUserTimeZone(target as any, reqInit);
  const { now } = getNow(tz, reqInit);
  const dateParam = search.get('date');
  if (dateParam) {
    const record = await getReviewExtensionForDate(targetUserId, dateParam);
    return NextResponse.json(responseFromRecord(record, 'historical', false));
  }
  const record = await getActiveReviewExtension(targetUserId, now);
  return NextResponse.json(
    responseFromRecord(record, 'current', record ? true : false),
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const me = await ensureUser(session);
  const reqInit = buildReqInit(req);
  const tz = getUserTimeZone(me as any, reqInit);
  const { now } = getNow(tz, reqInit);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const reason = (body?.reason ?? '').toString().trim();
  if (!reason) {
    return NextResponse.json(
      { error: 'Please share a short reason for the extra time.' },
      { status: 400 },
    );
  }
  const limitedReason = reason.slice(0, 500);
  const today = startOfDay(now, tz);
  const midday = new Date(today.getTime() + 12 * 60 * 60 * 1000);
  let targetStart = today;
  if (now < midday) {
    targetStart = addDays(today, -1, tz);
  }
  const targetDate = toYMD(targetStart, tz);
  const nextDayStart = addDays(targetStart, 1, tz);
  const expiresAt = new Date(nextDayStart.getTime() + 12 * 60 * 60 * 1000);
  const record = await upsertReviewExtension({
    userId: me.id,
    targetDate,
    reason: limitedReason,
    expiresAt,
  });
  return NextResponse.json({
    extension: {
      reason: record.reason,
      targetDate: record.targetDate,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      active: true,
    },
  });
}
