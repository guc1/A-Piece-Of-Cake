import type { NextRequest } from 'next/server';

// Single source of truth for "now" in a timezone, with optional override.
export type ClockNow = { now: Date; tz: string };

export function getUserTimeZone(user?: { timeZone?: string }): string {
  return (
    user?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
}

function getOverrideFromCookie(): Date | null {
  if (typeof document === 'undefined') {
    try {
      const { cookies } = require('next/headers');
      const store = cookies();
      const raw = store.get('apoc_clock')?.value;
      if (!raw) return null;
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  } else {
    const match = document.cookie
      .split('; ')
      .find((c) => c.startsWith('apoc_clock='));
    if (match) {
      const raw = decodeURIComponent(match.split('=')[1]);
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
}

function parseQueryOverride(tz: string, params: URLSearchParams): Date | null {
  const d = params.get('apoc_date');
  const t = params.get('apoc_time');
  if (!d || !t) return null;
  const [year, month, day] = d.split('-').map((n) => parseInt(n, 10));
  const [hour, minute] = t.split(':').map((n) => parseInt(n, 10));
  if (
    [year, month, day, hour, minute].some((n) => Number.isNaN(n)) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  )
    return null;
  // create UTC date then adjust for timezone
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = getTimeZoneOffset(utc, tz);
  return new Date(utc.getTime() - offset);
}

function getTimeZoneOffset(date: Date, tz: string): number {
  const inv = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  return date.getTime() - inv.getTime();
}

export function getNow(
  tz: string,
  req?: NextRequest | { searchParams?: URLSearchParams },
): Date {
  let override: Date | null = null;
  if (req && 'cookies' in req && typeof req.cookies.get === 'function') {
    const raw = req.cookies.get('apoc_clock')?.value;
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) override = d;
    }
    const params = req.nextUrl?.searchParams;
    if (!override && params) override = parseQueryOverride(tz, params);
  }
  if (!override) {
    let params =
      'searchParams' in (req || {}) ? (req as any).searchParams : undefined;
    if (!params && typeof window !== 'undefined') {
      params = new URLSearchParams(window.location.search);
    }
    if (params) override = parseQueryOverride(tz, params);
  }
  if (!override) override = getOverrideFromCookie();
  return override ?? new Date();
}

export function startOfDay(d: Date, tz: string): Date {
  const s = toYMD(d, tz);
  return new Date(`${s}T00:00:00.000Z`);
}

export function addDays(d: Date, n: number, tz: string): Date {
  const start = startOfDay(d, tz);
  return new Date(start.getTime() + n * 86400000);
}

export function toYMD(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
}

export function getOverride(
  tz: string,
  req?: NextRequest | { searchParams?: URLSearchParams },
): Date | null {
  let override: Date | null = null;
  if (req && 'cookies' in req && typeof req.cookies.get === 'function') {
    const raw = req.cookies.get('apoc_clock')?.value;
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) override = d;
    }
    const params = req.nextUrl?.searchParams;
    if (!override && params) override = parseQueryOverride(tz, params);
  }
  if (!override) {
    let params =
      'searchParams' in (req || {}) ? (req as any).searchParams : undefined;
    if (!params && typeof window !== 'undefined') {
      params = new URLSearchParams(window.location.search);
    }
    if (params) override = parseQueryOverride(tz, params);
  }
  if (!override) override = getOverrideFromCookie();
  return override;
}
