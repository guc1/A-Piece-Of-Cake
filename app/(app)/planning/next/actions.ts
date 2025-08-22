'use server';

import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { assertOwner } from '@/lib/profile';
import { savePlan, getPlanStrict } from '@/lib/plans-store';
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

export async function addIngredientAction(
  date: string,
  blockId: string,
  ingredientId: string,
  mode: 'next' | 'live' = 'next',
) {
  const session = await auth();
  const self = await ensureUser(session);
  await assertOwner(self.id, self.id);
  const plan = await getPlanStrict(self.id, date);
  const blocks = plan.blocks.map((b) =>
    b.id === blockId
      ? {
          ...b,
          ingredientIds: b.ingredientIds.includes(Number(ingredientId))
            ? b.ingredientIds
            : [...b.ingredientIds, Number(ingredientId)],
        }
      : b,
  );
  await savePlan(String(self.id), date, blocks);
  revalidatePath(`/planning/${mode}`);
}
