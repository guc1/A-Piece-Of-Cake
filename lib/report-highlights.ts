import { db } from './db';
import {
  reportHighlights,
  reportHighlightTypeEnum,
} from './db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';

export type ReportHighlightType =
  (typeof reportHighlightTypeEnum.enumValues)[number];

export type ReportHighlightRow = typeof reportHighlights.$inferSelect;

export interface ReportHighlight {
  id: number;
  userId: number;
  reportType: ReportHighlightType;
  targetSlug: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
  color: string;
  snippet: string;
  createdAt: string;
}

export interface ReportHighlightInput {
  reportType: ReportHighlightType;
  targetSlug: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
  color: string;
  snippet: string;
}

function toHighlight(row: ReportHighlightRow): ReportHighlight {
  return {
    id: row.id,
    userId: row.userId ?? 0,
    reportType: row.reportType as ReportHighlightType,
    targetSlug: row.targetSlug ?? '',
    blockId: row.blockId ?? '',
    startOffset: row.startOffset ?? 0,
    endOffset: row.endOffset ?? 0,
    color: row.color ?? '#f97316',
    snippet: row.snippet ?? '',
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

function sanitizeColor(color: string): string {
  const trimmed = color.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  throw new Error('Invalid highlight color');
}

function sanitizeSnippet(snippet: string): string {
  const trimmed = snippet.trim();
  if (!trimmed) {
    throw new Error('Cannot highlight empty text');
  }
  return trimmed.slice(0, 500);
}

function sanitizeOffsets(start: number, end: number): { start: number; end: number } {
  const startOffset = Number.isFinite(start) ? Math.max(0, Math.floor(start)) : 0;
  const endOffset = Number.isFinite(end) ? Math.max(0, Math.floor(end)) : 0;
  if (endOffset <= startOffset) {
    throw new Error('Highlight end must be after start');
  }
  if (endOffset - startOffset > 4000) {
    throw new Error('Highlight selection is too large');
  }
  return { start: startOffset, end: endOffset };
}

function sanitizeTarget(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required`);
  }
  if (trimmed.length > 160) {
    throw new Error(`${label} is too long`);
  }
  return trimmed;
}

export async function listReportHighlights(
  userId: number,
  reportType: ReportHighlightType,
): Promise<ReportHighlight[]> {
  const rows = await db
    .select()
    .from(reportHighlights)
    .where(
      and(
        eq(reportHighlights.userId, userId),
        eq(reportHighlights.reportType, reportType),
      ),
    )
    .orderBy(desc(reportHighlights.createdAt));
  return rows.map(toHighlight);
}

export async function listHighlightsForTargets(
  userId: number,
  reportType: ReportHighlightType,
  targetSlugs: string[],
): Promise<ReportHighlight[]> {
  if (targetSlugs.length === 0) return [];
  const rows = await db
    .select()
    .from(reportHighlights)
    .where(
      and(
        eq(reportHighlights.userId, userId),
        eq(reportHighlights.reportType, reportType),
        inArray(reportHighlights.targetSlug, targetSlugs),
      ),
    )
    .orderBy(reportHighlights.targetSlug, reportHighlights.startOffset);
  return rows.map(toHighlight);
}

export async function saveReportHighlight(
  userId: number,
  input: ReportHighlightInput,
): Promise<ReportHighlight> {
  const { start, end } = sanitizeOffsets(input.startOffset, input.endOffset);
  const snippet = sanitizeSnippet(input.snippet);
  const targetSlug = sanitizeTarget(input.targetSlug, 'Target');
  const blockId = sanitizeTarget(input.blockId, 'Block');
  const color = sanitizeColor(input.color);

  const now = new Date();
  const [row] = await db
    .insert(reportHighlights)
    .values({
      userId,
      reportType: input.reportType,
      targetSlug,
      blockId,
      startOffset: start,
      endOffset: end,
      color,
      snippet,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: [
        reportHighlights.userId,
        reportHighlights.reportType,
        reportHighlights.targetSlug,
        reportHighlights.blockId,
        reportHighlights.startOffset,
        reportHighlights.endOffset,
      ],
      set: {
        color,
        snippet,
        createdAt: now,
      },
    })
    .returning();

  return toHighlight(row);
}
