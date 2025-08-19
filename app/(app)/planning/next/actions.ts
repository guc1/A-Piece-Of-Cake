'use server';

import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { assertOwner } from '@/lib/profile';
import { getPlan, savePlan, deletePlan } from '@/lib/plans-store';
import type { PlanBlockInput } from '@/types/plan';
import { revalidatePath } from 'next/cache';

export async function savePlanAction(
  date: string,
  blocks: PlanBlockInput[],
) {
  const session = await auth();
  const self = await ensureUser(session);
  await assertOwner(self.id, self.id);
  const plan = await savePlan(String(self.id), date, blocks);
  revalidatePath('/planning');
  return plan;
}

export async function rolloverPlanAction(from: string, to: string) {
  const session = await auth();
  const self = await ensureUser(session);
  await assertOwner(self.id, self.id);
  const existing = await getPlan(String(self.id), to);
  if (existing) return;
  const prev = await getPlan(String(self.id), from);
  if (!prev) return;
  const blocks: PlanBlockInput[] = prev.blocks.map((b) => ({
    id: b.id,
    start: b.start,
    end: b.end,
    title: b.title,
    description: b.description,
    color: b.color,
  }));
  await savePlan(String(self.id), to, blocks);
  await deletePlan(String(self.id), from);
}
