import { resolvePlanDate } from './plan-date';
import { parseYMD, toYMD, type ReqInit } from './clock';
import {
  getActiveReviewExtension,
  type ReviewExtensionRecord,
} from './review-extension-store';

export interface ReviewExtensionState
  extends Pick<ReviewExtensionRecord, 'reason' | 'targetDate' | 'expiresAt' | 'createdAt'> {
  active: boolean;
}

export type ReviewDateInfo = ReturnType<typeof resolvePlanDate> & {
  reviewDate: Date;
  reviewYMD: string;
  extension?: ReviewExtensionState;
};

export async function resolveReviewDate(
  user: { timeZone?: string } & Record<string, unknown>,
  userId: number,
  req?: ReqInit,
): Promise<ReviewDateInfo> {
  const base = resolvePlanDate('review', user, req);
  let reviewDate = base.date;
  let extensionInfo: ReviewExtensionState | undefined;
  const extension = await getActiveReviewExtension(userId, base.now);
  if (extension) {
    reviewDate = parseYMD(extension.targetDate, base.tz);
    extensionInfo = {
      reason: extension.reason,
      targetDate: extension.targetDate,
      expiresAt: extension.expiresAt,
      createdAt: extension.createdAt,
      active: true,
    };
  }
  return {
    ...base,
    date: reviewDate,
    reviewDate,
    reviewYMD: toYMD(reviewDate, base.tz),
    extension: extensionInfo,
  };
}
