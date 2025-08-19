import type { NextRequest } from 'next/server';
import { getUserTimeZone, getNow, startOfDay, addDays } from './clock';

export type PageKind = 'next' | 'live' | 'review';

export function resolvePlanDate(
  kind: PageKind,
  user: { timeZone?: string; [key: string]: any },
  req?: NextRequest | { searchParams?: URLSearchParams },
) {
  const tz = getUserTimeZone(user);
  const now = getNow(tz, req);
  const today = startOfDay(now, tz);
  const tomorrow = startOfDay(addDays(now, 1, tz), tz);
  return { tz, date: kind === 'next' ? tomorrow : today };
}
