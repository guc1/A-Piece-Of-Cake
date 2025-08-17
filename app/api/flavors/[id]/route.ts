import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { flavors } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

function sanitize(str: unknown, max: number) {
  return (typeof str === 'string' ? str : '').trim().slice(0, max);
}

function clamp(num: unknown) {
  const n = typeof num === 'number' ? num : Number(num);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;
  const id = Number(params.id);
  const body = await req.json();
  const updates: any = {};
  if (body.name !== undefined) {
    const name = sanitize(body.name, 40);
    if (name.length < 2) {
      return NextResponse.json({ error: 'Name too short' }, { status: 400 });
    }
    updates.name = name;
  }
  if (body.description !== undefined) {
    updates.description = sanitize(body.description, 280);
  }
  if (body.color !== undefined) {
    updates.color = /^#([0-9a-fA-F]{6})$/.test(body.color)
      ? body.color
      : '#000000';
  }
  if (body.icon !== undefined) {
    updates.icon = sanitize(body.icon, 64) || 'star';
  }
  if (body.importance !== undefined) {
    updates.importance = clamp(body.importance);
  }
  if (body.targetMix !== undefined) {
    updates.targetMix = clamp(body.targetMix);
  }
  if (body.visibility !== undefined) {
    updates.visibility = ['private', 'friends', 'followers', 'public'].includes(
      body.visibility
    )
      ? body.visibility
      : 'public';
  }
  if (body.orderIndex !== undefined) {
    updates.orderIndex = typeof body.orderIndex === 'number' ? body.orderIndex : 0;
  }
  updates.updatedAt = new Date();
  const [flavor] = await db
    .update(flavors)
    .set(updates)
    .where(and(eq(flavors.id, id), eq(flavors.userId, userId)))
    .returning();
  if (!flavor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(flavor);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;
  const id = Number(params.id);
  const [flavor] = await db
    .delete(flavors)
    .where(and(eq(flavors.id, id), eq(flavors.userId, userId)))
    .returning();
  if (!flavor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
