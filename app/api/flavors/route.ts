import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { flavors } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { desc, asc, eq } from 'drizzle-orm';

function sanitize(str: unknown, max: number) {
  return (typeof str === 'string' ? str : '').trim().slice(0, max);
}

function clamp(num: unknown) {
  const n = typeof num === 'number' ? num : Number(num);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64);
}

export async function GET() {
  const session = await auth();
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json([], { status: 200 });
  }
  const userId = (session.user as any).id as string;
  const data = await db
    .select()
    .from(flavors)
    .where(eq(flavors.userId, userId))
    .orderBy(desc(flavors.importance), asc(flavors.orderIndex), asc(flavors.createdAt));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;
  const body = await req.json();
  const name = sanitize(body.name, 40);
  if (name.length < 2) {
    return NextResponse.json({ error: 'Name too short' }, { status: 400 });
  }
  const description = sanitize(body.description, 280);
  const color = /^#([0-9a-fA-F]{6})$/.test(body.color) ? body.color : '#000000';
  const icon = sanitize(body.icon, 64) || 'star';
  const importance = clamp(body.importance);
  const targetMix = clamp(body.targetMix);
  const visibility = ['private', 'friends', 'followers', 'public'].includes(body.visibility)
    ? body.visibility
    : 'public';
  const orderIndex = typeof body.orderIndex === 'number' ? body.orderIndex : 0;
  const slug = slugify(name);
  const [flavor] = await db
    .insert(flavors)
    .values({
      userId,
      slug,
      name,
      description,
      color,
      icon,
      importance,
      targetMix,
      visibility,
      orderIndex,
    })
    .returning();
  return NextResponse.json(flavor, { status: 201 });
}
