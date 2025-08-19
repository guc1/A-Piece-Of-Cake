import { cookies } from 'next/headers';

/**
 * Returns the current site date, respecting any override stored in the
 * `site-date` cookie. Falls back to the real system time when no override is
 * present.
 */
export async function getSiteDate(): Promise<Date> {
  const cookie = (await cookies()).get('site-date');
  if (cookie) {
    const t = Number(cookie.value);
    if (!Number.isNaN(t)) {
      return new Date(t);
    }
  }
  return new Date();
}
