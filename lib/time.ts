import { cookies } from 'next/headers';

export async function getTimeOffset(): Promise<number> {
  const cookieStore = await cookies();
  const offsetStr = cookieStore.get('timeOffset')?.value;
  const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
  return Number.isFinite(offset) ? offset : 0;
}

export async function getServerDate(): Promise<Date> {
  const offset = await getTimeOffset();
  return new Date(Date.now() + offset);
}

export async function getServerTomorrow(): Promise<Date> {
  const now = await getServerDate();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}
