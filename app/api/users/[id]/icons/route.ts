import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listUserIcons } from '@/lib/icons-store';

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
