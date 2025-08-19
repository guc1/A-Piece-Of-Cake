'use server';

import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { assertOwner } from '@/lib/profile';
import { savePlan } from '@/lib/plans-store';
import type { PlanBlockInput } from '@/types/plan';
import { revalidatePath } from 'next/cache';

export async function savePlanAction(
  date: string,
  blocks: PlanBlockInput[],
  vibe?: string,
) {
  const session = await auth();
  const self = await ensureUser(session);
  await assertOwner(self.id, self.id);
  const plan = await savePlan(String(self.id), date, blocks, vibe);
  revalidatePath('/planning');
  return plan;
}
