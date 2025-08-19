import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  listUserIcons,
  saveUserIcon,
  deleteUserIcon,
} from '@/lib/icons-store';

export async function GET(
  _req: Request,
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
  const icons = await listUserIcons(userId);
  return NextResponse.json({ icons });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const sessionUserId = Number(session?.user?.id);
  if (!sessionUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const userId = id === 'me' ? sessionUserId : Number(id);
  if (userId !== sessionUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { icon } = await req.json();
  if (!icon || typeof icon !== 'string') {
    return NextResponse.json({ error: 'Invalid icon' }, { status: 400 });
  }
  await saveUserIcon(userId, icon);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const sessionUserId = Number(session?.user?.id);
  if (!sessionUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const userId = id === 'me' ? sessionUserId : Number(id);
  if (userId !== sessionUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { icon } = await req.json();
  if (!icon || typeof icon !== 'string') {
    return NextResponse.json({ error: 'Invalid icon' }, { status: 400 });
  }
  await deleteUserIcon(userId, icon);
  return NextResponse.json({ ok: true });
}
