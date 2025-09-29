import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getPlanAt } from '@/lib/plans-store';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  if (!date) {
    return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const me = await ensureUser(session);
  const plan = await getPlanAt(me.id, date, new Date());
  return NextResponse.json(plan, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
