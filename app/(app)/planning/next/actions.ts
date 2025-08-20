'use server';

import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { assertOwner } from '@/lib/profile';
import { savePlan } from '@/lib/plans-store';
import type { PlanBlockInput } from '@/types/plan';
import { getUserTimeZone, getNow, startOfDay, toYMD } from '@/lib/clock';
import { revalidatePath } from 'next/cache';

export async function savePlanAction(
  date: string,
  blocks: PlanBlockInput[],
) {
  const session = await auth();
  const self = await ensureUser(session);
  await assertOwner(self.id, self.id);
  const tz = getUserTimeZone(self);
  const { now } = getNow(tz);
  const snap = toYMD(startOfDay(now, tz), tz);
  const plan = await savePlan(String(self.id), date, blocks, snap);
  revalidatePath('/planning');
  return plan;
}
