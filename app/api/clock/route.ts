import { NextRequest, NextResponse } from 'next/server';
import { getNow, toYMD, getUserTimeZone } from '@/lib/clock';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const tz = getUserTimeZone(undefined, {
    cookies: req.cookies,
    searchParams: params,
  });
  const { now } = getNow(tz, {
    cookies: req.cookies,
    searchParams: params,
  });
  return NextResponse.json({ now: now.toISOString(), ymd: toYMD(now, tz) });
}
