import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listUserIcons, setUserIcons } from '@/lib/icons-store';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const icons = await listUserIcons(Number(session.user.id));
  return NextResponse.json({ icons });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await req.json();
    const icons = Array.isArray(data.icons)
      ? data.icons.filter((i: unknown) => typeof i === 'string')
      : [];
    await setUserIcons(Number(session.user.id), icons);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
