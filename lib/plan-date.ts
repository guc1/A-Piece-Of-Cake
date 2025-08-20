import type { ReqInit } from './clock';
import { getUserTimeZone, getNow, startOfDay, addDays, toYMD } from './clock';

function first(val?: string | string[]): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val;
}

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
  let date = kind === 'next' ? tomorrow : today;
  if (kind === 'next') {
    const raw = first(req?.searchParams?.['date']);
    if (raw) {
      const candidate = startOfDay(new Date(raw), tz);
      if (candidate.getTime() >= tomorrow.getTime()) {
        date = candidate;
      }
    }
  }
  return { tz, date, today, now, override };
}

export { toYMD } from './clock';
