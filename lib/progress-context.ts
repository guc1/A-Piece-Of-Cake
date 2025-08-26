import { db } from '@/lib/db';
import { plans, planBlocks } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function getTodayPlanContext(userId: number, isoDate: string) {
  const planRows = await db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, userId), eq(plans.date, isoDate)))
    .limit(1);
  const plan = planRows[0];
  if (!plan) {
    return { date: isoDate, dailyAim: '', activities: [], reviews: {} };
  }
  const blocks = await db
    .select()
    .from(planBlocks)
    .where(eq(planBlocks.planId, plan.id));
  return {
    date: isoDate,
    dailyAim: plan.dailyAim ?? '',
    activities: blocks.map((b) => ({
      id: b.id,
      title: b.title,
      start: b.start,
      end: b.end,
      description: b.description,
    })),
    reviews: {}, // TODO: incorporate review data
  };
}
