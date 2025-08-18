'use server';

import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { assertOwner } from '@/lib/profile';
import { savePlan } from '@/lib/planning-store';
import type { PlanBlockInput } from '@/types/plan';

function tomorrowISO() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return now.toISOString().slice(0, 10);
}

export async function saveNextDayPlan(blocks: PlanBlockInput[]) {
  const session = await auth();
  const me = await ensureUser(session);
  await assertOwner(me.id, me.id);
  const date = tomorrowISO();
  return savePlan(String(me.id), date, blocks);
}
