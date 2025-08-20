import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMyIcons, saveMyIcons } from '@/lib/icons-store';
import { ensureUser } from '@/lib/users';
import { getProfileSnapshot } from '@/lib/profile-snapshots';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await ensureUser(session);
  const url = new URL(req.url);
  const snapshot = url.searchParams.get('snapshot');
  let icons: string[];
  if (snapshot) {
    const snap = await getProfileSnapshot(user.id, snapshot);
    if (Array.isArray(snap?.icons)) {
      icons = snap.icons as string[];
    } else {
      icons = await getMyIcons(user.id);
    }
  } else {
    icons = await getMyIcons(user.id);
  }
  return NextResponse.json({ icons });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await ensureUser(session);
  const body = await req.json();
  const icons = Array.isArray(body.icons) ? body.icons.map(String) : [];
  await saveMyIcons(user.id, icons);
  return NextResponse.json({ ok: true });
}
