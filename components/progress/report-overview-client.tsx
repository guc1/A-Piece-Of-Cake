'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useViewContext } from '@/lib/view-context';
import type {
  ReportHighlight,
  ReportHighlightType,
} from '@/lib/report-highlights';
import type { ReportOverviewItem } from '@/types/report-overview';
import HighlightableText from './highlightable-text';
import {
  HighlightingProvider,
  type HighlightCreationInput,
} from './highlighting-context';

interface HighlightRange {
  id: number;
  startOffset: number;
  endOffset: number;
  color: string;
  snippet: string;
  createdAt: string;
}

type HighlightMap = Record<string, Record<string, HighlightRange[]>>;

const HIGHLIGHT_COLORS = [
  '#f97316',
  '#facc15',
  '#34d399',
  '#60a5fa',
  '#f472b6',
  '#a855f7',
];

function groupHighlights(highlights: ReportHighlight[]): HighlightMap {
  const map: HighlightMap = {};
  for (const h of highlights) {
    if (!h.targetSlug || !h.blockId) continue;
    const slugMap = map[h.targetSlug] ?? (map[h.targetSlug] = {});
    const blockArr = slugMap[h.blockId] ?? (slugMap[h.blockId] = []);
    blockArr.push({
      id: h.id,
      startOffset: h.startOffset,
      endOffset: h.endOffset,
      color: h.color,
      snippet: h.snippet,
      createdAt: h.createdAt,
    });
  }
  for (const slug of Object.keys(map)) {
    const block = map[slug];
    for (const key of Object.keys(block)) {
      block[key].sort((a, b) => a.startOffset - b.startOffset);
    }
  }
  return map;
}

function addHighlight(map: HighlightMap, highlight: ReportHighlight): HighlightMap {
  const next: HighlightMap = { ...map };
  const slugMap = { ...(next[highlight.targetSlug] ?? {}) };
  const existing = [...(slugMap[highlight.blockId] ?? [])];
  const replacement: HighlightRange = {
    id: highlight.id,
    startOffset: highlight.startOffset,
    endOffset: highlight.endOffset,
    color: highlight.color,
    snippet: highlight.snippet,
    createdAt: highlight.createdAt,
  };
  const filtered = existing.filter(
    (h) => !(h.startOffset === replacement.startOffset && h.endOffset === replacement.endOffset),
  );
  filtered.push(replacement);
  filtered.sort((a, b) => a.startOffset - b.startOffset);
  slugMap[highlight.blockId] = filtered;
  next[highlight.targetSlug] = slugMap;
  return next;
}

interface ReportOverviewClientProps {
  userId: number;
  reportType: ReportHighlightType;
  idPrefix: string;
  items: ReportOverviewItem[];
  initialHighlights: ReportHighlight[];
  highlightLink: string;
}

export default function ReportOverviewClient({
  userId,
  reportType,
  idPrefix,
  items,
  initialHighlights,
  highlightLink,
}: ReportOverviewClientProps) {
  const { editable } = useViewContext();
  const [highlightMap, setHighlightMap] = useState<HighlightMap>(() =>
    groupHighlights(initialHighlights),
  );
  const [highlightMode, setHighlightMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateHighlight = useCallback(
    async (input: HighlightCreationInput) => {
      setErrorMessage(null);
      setStatusMessage(null);
      setIsSaving(true);
      try {
        const res = await fetch('/api/progress/highlights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...input,
            color: selectedColor,
            reportType,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : 'Failed to save highlight',
          );
        }
        const highlight = data.highlight as ReportHighlight;
        setHighlightMap((prev) => addHighlight(prev, highlight));
        setStatusMessage('Highlight saved');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save highlight';
        setErrorMessage(message);
      } finally {
        setIsSaving(false);
      }
    },
    [reportType, selectedColor],
  );

  const toggleHighlightMode = useCallback(() => {
    if (!editable) return;
    setHighlightMode((prev) => !prev);
    setErrorMessage(null);
    setStatusMessage(null);
  }, [editable]);

  const highlightContext = useMemo(
    () => ({
      highlightEnabled: editable && highlightMode,
      selectedColor,
      editable,
      isSaving,
      createHighlight: handleCreateHighlight,
    }),
    [editable, highlightMode, selectedColor, isSaving, handleCreateHighlight],
  );

  const palette = editable && highlightMode;

  return (
    <HighlightingProvider value={highlightContext}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {editable && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleHighlightMode}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                  highlightMode
                    ? 'border-orange-500 bg-orange-100 text-orange-700'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-orange-400 hover:text-orange-600',
                )}
                aria-pressed={highlightMode}
                disabled={isSaving}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-200 text-orange-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M3 12c2.5-6.5 7.5-9 13-7.5 3 .8 4.5 3.5 3.5 5.8-1 2.3-3.3 3.3-5.5 3.3H9.5c-1.7 0-2.7 1.7-2 3.1l.3.7" />
                    <path d="M7.5 21h2l1.5-3" />
                  </svg>
                </span>
                Highlight
              </button>
              {palette && (
                <div className="flex items-center gap-2">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={clsx(
                        'h-7 w-7 rounded-full border-2 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2',
                        selectedColor === color
                          ? 'border-zinc-900'
                          : 'border-transparent',
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Use ${color} highlight color`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <Link
            href={highlightLink}
            className="inline-flex items-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-orange-600 transition hover:border-orange-400 hover:text-orange-700"
          >
            View highlights
          </Link>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          {highlightMode && editable && (
            <span className="text-zinc-500">
              Select any text to save it. Highlights are shared instantly.
            </span>
          )}
          {errorMessage && (
            <span className="text-red-600">{errorMessage}</span>
          )}
          {statusMessage && !errorMessage && (
            <span className="text-green-600">{statusMessage}</span>
          )}
        </div>
      </div>
      <ul className="space-y-4" id={`${idPrefix}-list-${userId}`}>
        {items.map((item) => {
          if (item.type === 'missing') {
            return (
              <li
                key={item.key}
                className="rounded border p-4"
                id={`${idPrefix}-miss-${item.key}-${userId}`}
              >
                <h2 className="font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm text-zinc-600">{item.message}</p>
              </li>
            );
          }
          const slugHighlights = highlightMap[item.slug] ?? {};
          const headerText =
            item.version && item.version > 1
              ? `${item.title} (v${item.version})`
              : item.title;
          return (
            <li
              key={item.key}
              className="rounded border p-4"
              id={`${idPrefix}-item-${item.slug}-${userId}`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <HighlightableText
                  as="h2"
                  id={`${idPrefix}-date-${item.slug}-${userId}`}
                  className="font-semibold"
                  text={headerText}
                  targetSlug={item.slug}
                  blockId="title"
                  highlights={slugHighlights.title}
                />
                <div className="flex items-center gap-2">
                  <HighlightableText
                    as="span"
                    id={`${idPrefix}-tone-${item.slug}-${userId}`}
                    className="font-semibold"
                    text={item.toneName}
                    targetSlug={item.slug}
                    blockId="tone"
                    highlights={slugHighlights.tone}
                  />
                  <HighlightableText
                    as="span"
                    id={`${idPrefix}-score-${item.slug}-${userId}`}
                    className="font-semibold"
                    text={String(item.score)}
                    targetSlug={item.slug}
                    blockId="score"
                    highlights={slugHighlights.score}
                  />
                  <HighlightableText
                    as="span"
                    id={`${idPrefix}-diff-${item.slug}-${userId}`}
                    className="ml-1 text-sm text-zinc-600"
                    text={item.difficultyLabel}
                    targetSlug={item.slug}
                    blockId="difficulty"
                    highlights={slugHighlights.difficulty}
                  />
                </div>
              </div>
              {item.summary && (
                <HighlightableText
                  as="p"
                  id={`${idPrefix}-sum-${item.slug}-${userId}`}
                  className="mt-2 whitespace-pre-wrap"
                  text={item.summary}
                  targetSlug={item.slug}
                  blockId="summary"
                  highlights={slugHighlights.summary}
                />
              )}
              {item.good.length > 0 && (
                <div className="mt-2" id={`${idPrefix}-good-${item.slug}-${userId}`}>
                  <h3 className="font-semibold">What went well</h3>
                  <ul className="list-disc pl-4">
                    {item.good.map((text, index) => (
                      <HighlightableText
                        key={index}
                        as="li"
                        id={`${idPrefix}-good-${index}-${item.slug}-${userId}`}
                        text={text}
                        targetSlug={item.slug}
                        blockId={`good-${index}`}
                        highlights={slugHighlights[`good-${index}`]}
                      />
                    ))}
                  </ul>
                </div>
              )}
              {item.bad.length > 0 && (
                <div className="mt-2" id={`${idPrefix}-bad-${item.slug}-${userId}`}>
                  <h3 className="font-semibold">What went bad</h3>
                  <ul className="list-disc pl-4">
                    {item.bad.map((text, index) => (
                      <HighlightableText
                        key={index}
                        as="li"
                        id={`${idPrefix}-bad-${index}-${item.slug}-${userId}`}
                        text={text}
                        targetSlug={item.slug}
                        blockId={`bad-${index}`}
                        highlights={slugHighlights[`bad-${index}`]}
                      />
                    ))}
                  </ul>
                </div>
              )}
              {item.observations.length > 0 && (
                <div className="mt-2" id={`${idPrefix}-obs-${item.slug}-${userId}`}>
                  <h3 className="font-semibold">Observations</h3>
                  <ul className="list-disc pl-4">
                    {item.observations.map((text, index) => (
                      <HighlightableText
                        key={index}
                        as="li"
                        id={`${idPrefix}-obs-${index}-${item.slug}-${userId}`}
                        text={text}
                        targetSlug={item.slug}
                        blockId={`obs-${index}`}
                        highlights={slugHighlights[`obs-${index}`]}
                      />
                    ))}
                  </ul>
                </div>
              )}
              <Link
                href={item.linkHref}
                className="mt-2 block text-sm text-orange-600 hover:underline"
                id={`${idPrefix}-link-${item.slug}-${userId}`}
              >
                View details
              </Link>
            </li>
          );
        })}
      </ul>
    </HighlightingProvider>
  );
}
