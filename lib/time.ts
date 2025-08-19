import { cookies } from 'next/headers';

export async function getServerNow(): Promise<Date> {
  const cookieStore = await cookies();
  const offsetStr = cookieStore.get('timeOffset')?.value;
  const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
  const now = Date.now() + (isNaN(offset) ? 0 : offset);
  return new Date(now);
}
