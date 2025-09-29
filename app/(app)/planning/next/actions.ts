'use server';

import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { assertOwner } from '@/lib/profile';
import { savePlan, getPlanStrict, getPlanAt } from '@/lib/plans-store';
import type { Plan, PlanBlockInput } from '@/types/plan';
import type { ColorPreset } from '@/lib/color-presets';
import { revalidatePath } from 'next/cache';
import { getProfileSnapshot } from '@/lib/profile-snapshots';
import { getUserTimeZone, parseYMD, addDays } from '@/lib/clock';

type LoadPlanResult = {
  plan: Plan;
  previewPlan: Plan | null;
  snapshotCapturedAt: string | null;
  fromSnapshot: boolean;
};

export async function savePlanAction(
  date: string,
  blocks: PlanBlockInput[],
  dailyAim: string,
  dailyIngredientIds: number[],
  colorPresets: ColorPreset[],
) {
  const session = await auth();
  const self = await ensureUser(session);
  await assertOwner(self.id, self.id);
  const plan = await savePlan(
    String(self.id),
    date,
    blocks,
    dailyAim,
    dailyIngredientIds,
    colorPresets,
  );
  revalidatePath('/planning');
  return plan;
}

export async function addIngredientAction(
  date: string,
  blockId: string,
  ingredientId: string,
) {
  const session = await auth();
  const self = await ensureUser(session);
  await assertOwner(self.id, self.id);
  const plan = await getPlanStrict(self.id, date);
  if (blockId === 'day') {
    const dailyIngredientIds = plan.dailyIngredientIds.includes(
      Number(ingredientId),
    )
      ? plan.dailyIngredientIds
      : [...plan.dailyIngredientIds, Number(ingredientId)];
    await savePlan(
      String(self.id),
      date,
      plan.blocks,
      plan.dailyAim,
      dailyIngredientIds,
      plan.colorPresets ?? [],
    );
  } else {
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
    await savePlan(
      String(self.id),
      date,
      blocks,
      plan.dailyAim,
      plan.dailyIngredientIds,
      plan.colorPresets ?? [],
    );
  }
  revalidatePath('/planning/next');
  revalidatePath('/planning/live');
}

export async function loadPlanFromDateAction(date: string): Promise<LoadPlanResult> {
  const session = await auth();
  const self = await ensureUser(session);
  await assertOwner(self.id, self.id);

  const [plan, snapshot] = await Promise.all([
    getPlanStrict(self.id, date),
    getProfileSnapshot(self.id, date),
  ]);

  let previewPlan: Plan | null = null;
  let fromSnapshot = false;
  let snapshotCapturedAt: string | null = null;

  if (snapshot) {
    const tz = getUserTimeZone(self);
    const day = parseYMD(date, tz);
    const at = snapshot.createdAt ?? addDays(day, 1, tz);
    previewPlan = await getPlanAt(self.id, date, at);
    fromSnapshot = true;
    snapshotCapturedAt = snapshot.createdAt
      ? snapshot.createdAt.toISOString()
      : null;
  }

  if (!previewPlan) {
    previewPlan = plan;
  }

  return {
    plan,
    previewPlan,
    snapshotCapturedAt,
    fromSnapshot,
  };
}
