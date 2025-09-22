import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { saveTrackingOverride } from '@/lib/tracking-overrides-store';
import type {
  TrackingOverrideState,
  TrackingOverrideTarget,
} from '@/types/tracking';

const TARGET_TYPES: TrackingOverrideTarget[] = [
  'flavor',
  'subflavor',
  'ingredient',
];

const STATES: TrackingOverrideState[] = ['done', 'missed'];

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await ensureUser(session);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { date, targetType, targetId, state } = payload as Record<string, unknown>;

  if (typeof date !== 'string' || !isValidDate(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  if (!TARGET_TYPES.includes(targetType as TrackingOverrideTarget)) {
    return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
  }

  if (typeof targetId !== 'string' || !targetId.trim()) {
    return NextResponse.json({ error: 'Invalid target id' }, { status: 400 });
  }

  if (!STATES.includes(state as TrackingOverrideState)) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  try {
    const override = await saveTrackingOverride({
      userId: user.id,
      date,
      targetType: targetType as TrackingOverrideTarget,
      targetId: targetId.trim(),
      state: state as TrackingOverrideState,
    });

    revalidatePath('/progress/tracking');
    revalidatePath('/view/[viewId]/progress/tracking');

    return NextResponse.json({ override });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save override';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
