import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listFlavors, createFlavor } from '@/lib/flavors-store';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const flavors = listFlavors(userId);
  return NextResponse.json(flavors);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  try {
    const flavor = createFlavor(userId, sanitize(body));
    return NextResponse.json(flavor, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

function sanitize(body: any) {
  if (!body.name || body.name.length < 2 || body.name.length > 40) {
    throw new Error('Invalid name');
  }
  const description =
    typeof body.description === 'string' ? body.description.slice(0, 280) : '';
  const color =
    typeof body.color === 'string' && /^#?[0-9a-fA-F]{6}$/.test(body.color)
      ? body.color.startsWith('#')
        ? body.color
        : '#' + body.color
      : '#888888';
  const icon = typeof body.icon === 'string' ? body.icon : 'Star';
  const importance = clamp(Number(body.importance));
  const targetMix = clamp(Number(body.targetMix));
  const visibility: any = [
    'private',
    'friends',
    'followers',
    'public',
  ].includes(body.visibility)
    ? body.visibility
    : 'private';
  const orderIndex = typeof body.orderIndex === 'number' ? body.orderIndex : 0;
  return {
    name: body.name,
    description,
    color,
    icon,
    importance,
    targetMix,
    visibility,
    orderIndex,
    slug: typeof body.slug === 'string' ? body.slug : undefined,
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
