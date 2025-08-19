import { NextRequest, NextResponse } from 'next/server';
import { getNow, toYMD, getUserTimeZone } from '@/lib/clock';

export async function GET(req: NextRequest) {
  const tz =
    req.nextUrl.searchParams.get('tz') || getUserTimeZone();
  const { now } = getNow(tz, {
    cookies: req.cookies,
    searchParams: Object.fromEntries(req.nextUrl.searchParams),
  });
  return NextResponse.json({ now: now.toISOString(), ymd: toYMD(now, tz) });
}
