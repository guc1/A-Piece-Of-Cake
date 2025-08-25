import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getSubflavor,
  updateSubflavor,
  deleteSubflavor,
} from '@/lib/subflavors-store';

export async function GET(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const subflavor = await getSubflavor(userId, params.id, Number(userId));
  if (!subflavor)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(subflavor);
}

export async function PUT(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const updated = await updateSubflavor(userId, params.id, sanitize(body));
  if (!updated)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ok = await deleteSubflavor(userId, params.id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

function sanitize(body: any) {
  const out: any = {};
  if (body.name) {
    if (body.name.length < 2 || body.name.length > 40)
      throw new Error('Invalid name');
    out.name = body.name;
  }
  if (body.description) out.description = body.description.slice(0, 280);
  if (body.color && /^#?[0-9a-fA-F]{6}$/.test(body.color)) {
    out.color = body.color.startsWith('#') ? body.color : '#' + body.color;
  }
  if (body.icon) out.icon = body.icon;
  if (body.importance !== undefined)
    out.importance = clamp(Number(body.importance));
  if (body.targetMix !== undefined)
    out.targetMix = clamp(Number(body.targetMix));
  if (
    body.visibility &&
    ['private', 'friends', 'followers', 'public'].includes(body.visibility)
  ) {
    out.visibility = body.visibility;
  }
  if (body.orderIndex !== undefined) out.orderIndex = Number(body.orderIndex);
  return out;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
