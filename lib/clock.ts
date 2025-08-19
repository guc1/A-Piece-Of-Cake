import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export type ClockNow = { now: Date; tz: string; override: boolean };

type ReqLike = {
  cookies?: Pick<ReadonlyRequestCookies, 'get'>;
  searchParams?: Record<string, string | string[] | undefined>;
};

function getOffset(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10);
  }
  const asUTC = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour,
    map.minute,
    map.second,
  );
  return asUTC - date.getTime();
}

export function getUserTimeZone(user?: { timeZone?: string }): string {
  return (
    user?.timeZone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    'UTC'
  );
}

function first(val?: string | string[]): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val;
}

export function getNow(tz: string, req?: ReqLike): { now: Date; override: boolean } {
  let override = false;
  let result: Date | undefined;

  const dateParam = first(req?.searchParams?.['apoc_date']);
  const timeParam = first(req?.searchParams?.['apoc_time']);
  if (dateParam && timeParam) {
    const [y, m, d] = dateParam.split('-').map(Number);
    const [hh, mm] = timeParam.split(':').map(Number);
    const dateUTC = Date.UTC(y, m - 1, d, hh, mm);
    const offset = getOffset(new Date(dateUTC), tz);
    result = new Date(dateUTC - offset);
    override = true;
  }

  if (!result) {
    const cookie = req?.cookies?.get('apoc_clock')?.value;
    if (cookie) {
      const parsed = new Date(cookie);
      if (!isNaN(parsed.getTime())) {
        result = parsed;
        override = true;
      }
    }
  }

  if (!result) {
    result = new Date();
  }

  return { now: result, override };
}

export function startOfDay(d: Date, tz: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10);
  }
  const dateUTC = Date.UTC(map.year, map.month - 1, map.day);
  const offset = getOffset(new Date(dateUTC), tz);
  return new Date(dateUTC - offset);
}

export function addDays(d: Date, n: number, tz: string): Date {
  const start = startOfDay(d, tz);
  const targetUTC = start.getTime() + n * 86_400_000;
  const offset = getOffset(new Date(targetUTC), tz);
  return new Date(targetUTC - offset);
}

export function toYMD(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export type ReqInit = ReqLike;
