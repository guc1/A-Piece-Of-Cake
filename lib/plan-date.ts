import type { ReqInit } from './clock';
import { getUserTimeZone, getNow, startOfDay, addDays, toYMD } from './clock';

export type PageKind = 'next' | 'live' | 'review';

export function resolvePlanDate(
  kind: PageKind,
  user: { timeZone?: string } & Record<string, unknown>,
  req?: ReqInit,
) {
  const tz = getUserTimeZone(user);
  const { now, override } = getNow(tz, req);
  const today = startOfDay(now, tz);
  const tomorrow = addDays(today, 1, tz);
  const date = kind === 'next' ? tomorrow : today;
  return { tz, date, today, now, override };
}

export { toYMD } from './clock';
