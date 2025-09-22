import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { db } from '@/lib/db';
import {
  flavors,
  subflavors,
  ingredients,
  trackingOverrides,
} from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import {
  parseIngredientKey,
  type TrackingOverrideState,
  type TrackingOverrideTargetType,
} from '@/types/tracking';

const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const validTypes: TrackingOverrideTargetType[] = [
  'flavor',
  'subflavor',
  'ingredient',
];

type ParsedBase = {
  targetType: TrackingOverrideTargetType;
  targetId: string;
  date: string;
};

type ParsedPut = ParsedBase & { state: TrackingOverrideState };

type OwnCheckResult = { ok: true } | { ok: false; status: number; error: string };

function parseBasePayload(payload: unknown): { ok: true; data: ParsedBase } | { ok: false; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Invalid payload' };
  }
  const data = payload as Record<string, unknown>;
  const typeValue = typeof data.targetType === 'string' ? (data.targetType as string) : null;
  const targetType = validTypes.includes(typeValue as TrackingOverrideTargetType)
    ? (typeValue as TrackingOverrideTargetType)
    : null;
  const targetId = typeof data.targetId === 'string' && data.targetId.length > 0 && data.targetId.length <= 160
    ? data.targetId
    : null;
  const date = typeof data.date === 'string' && datePattern.test(data.date)
    ? data.date
    : null;
  if (!targetType || !targetId || !date) {
    return { ok: false, error: 'Invalid payload' };
  }
  return { ok: true, data: { targetType, targetId, date } };
}

function parsePutPayload(payload: unknown): { ok: true; data: ParsedPut } | { ok: false; error: string } {
  const base = parseBasePayload(payload);
  if (!base.ok) return base;
  const stateValue =
    typeof (payload as any)?.state === 'string' ? ((payload as any).state as string) : null;
  const state = stateValue === 'done' || stateValue === 'missed' ? (stateValue as TrackingOverrideState) : null;
  if (!state) {
    return { ok: false, error: 'Invalid payload' };
  }
  return { ok: true, data: { ...base.data, state } };
}

async function verifyOwnership(
  userId: number,
  type: TrackingOverrideTargetType,
  targetId: string,
): Promise<OwnCheckResult> {
  if (type === 'flavor') {
    const [row] = await db
      .select({ id: flavors.id })
      .from(flavors)
      .where(and(eq(flavors.id, targetId), eq(flavors.userId, userId)))
      .limit(1);
    if (!row) {
      return { ok: false, status: 404, error: 'Flavor not found' };
    }
    return { ok: true };
  }
  if (type === 'subflavor') {
    const [row] = await db
      .select({ id: subflavors.id })
      .from(subflavors)
      .where(and(eq(subflavors.id, targetId), eq(subflavors.userId, userId)))
      .limit(1);
    if (!row) {
      return { ok: false, status: 404, error: 'Subflavor not found' };
    }
    return { ok: true };
  }
  const numericId = parseIngredientKey(targetId);
  if (numericId == null) {
    return { ok: false, status: 400, error: 'Invalid ingredient id' };
  }
  const [row] = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(and(eq(ingredients.id, numericId), eq(ingredients.userId, userId)))
    .limit(1);
  if (!row) {
    return { ok: false, status: 404, error: 'Ingredient not found' };
  }
  return { ok: true };
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const me = await ensureUser(session);
    const payload = await req.json();
    const parsed = parsePutPayload(payload);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const data = parsed.data;
    const ownership = await verifyOwnership(
      me.id,
      data.targetType,
      data.targetId,
    );
    if (!ownership.ok) {
      return NextResponse.json(
        { error: ownership.error },
        { status: ownership.status },
      );
    }
    await db
      .insert(trackingOverrides)
      .values({
        userId: me.id,
        targetType: data.targetType,
        targetId: data.targetId,
        overrideDate: data.date,
        state: data.state,
      })
      .onConflictDoUpdate({
        target: [
          trackingOverrides.userId,
          trackingOverrides.targetType,
          trackingOverrides.targetId,
          trackingOverrides.overrideDate,
        ],
        set: {
          state: data.state,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to store tracking override', error);
    return NextResponse.json(
      { error: 'Failed to save override' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const me = await ensureUser(session);
    const payload = await req.json();
    const parsed = parseBasePayload(payload);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const data = parsed.data;
    const ownership = await verifyOwnership(
      me.id,
      data.targetType,
      data.targetId,
    );
    if (!ownership.ok) {
      return NextResponse.json(
        { error: ownership.error },
        { status: ownership.status },
      );
    }

    await db
      .delete(trackingOverrides)
      .where(
        and(
          eq(trackingOverrides.userId, me.id),
          eq(trackingOverrides.targetType, data.targetType),
          eq(trackingOverrides.targetId, data.targetId),
          eq(trackingOverrides.overrideDate, data.date),
        ),
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete tracking override', error);
    return NextResponse.json(
      { error: 'Failed to delete override' },
      { status: 500 },
    );
  }
}
