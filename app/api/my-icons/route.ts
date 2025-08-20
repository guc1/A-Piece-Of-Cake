import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMyIcons, saveMyIcons } from '@/lib/icons-store';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const icons = await getMyIcons(Number(userId));
  return NextResponse.json({ icons });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const icons = Array.isArray(body.icons) ? body.icons.map(String) : [];
  await saveMyIcons(Number(userId), icons);
  return NextResponse.json({ ok: true });
}
