import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listUserIcons } from '@/lib/icons-store';
import { getProfileSnapshot } from '@/lib/profile-snapshots';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const userId = Number(id);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
  }
  const url = new URL(req.url);
  const snapshot = url.searchParams.get('snapshot');
  let icons: string[];
  if (snapshot) {
    const snap = await getProfileSnapshot(userId, snapshot);
    if (Array.isArray(snap?.icons)) {
      icons = snap.icons as string[];
    } else {
      icons = await listUserIcons(userId);
    }
  } else {
    icons = await listUserIcons(userId);
  }
  return NextResponse.json({ icons });
}
