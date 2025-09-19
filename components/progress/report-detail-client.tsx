'use client';

import { useMemo } from 'react';
import { useViewContext } from '@/lib/view-context';
import type { ReportHighlight } from '@/lib/report-highlights';
import HighlightableText from './highlightable-text';
import { HighlightingProvider } from './highlighting-context';

type HighlightRange = {
  id: number;
  startOffset: number;
  endOffset: number;
  color: string;
  snippet: string;
  createdAt: string;
};

type HighlightMap = Record<string, HighlightRange[] | undefined>;

interface ReportDetailClientProps {
  idPrefix: string;
  userId: number;
  slug: string;
  title: string;
  titlePrefix?: string;
  version?: number | null;
  toneName: string;
  toneCustom?: string;
  score: number;
  difficultyLabel: string;
  summary?: string | null;
  good: string[];
  bad: string[];
  observations: string[];
  highlights: ReportHighlight[];
}

const noop = async () => {};

function buildHighlightMap(
  highlights: ReportHighlight[],
  slug: string,
): HighlightMap {
  const map: Record<string, HighlightRange[]> = {};
  for (const highlight of highlights) {
    if (highlight.targetSlug !== slug) continue;
    if (!highlight.blockId) continue;
    const bucket = map[highlight.blockId] ?? (map[highlight.blockId] = []);
    bucket.push({
      id: highlight.id,
      startOffset: highlight.startOffset,
      endOffset: highlight.endOffset,
      color: highlight.color,
      snippet: highlight.snippet,
      createdAt: highlight.createdAt,
    });
  }
  for (const bucket of Object.values(map)) {
    bucket.sort((a, b) => a.startOffset - b.startOffset);
  }
  return map;
}

export default function ReportDetailClient({
  idPrefix,
  userId,
  slug,
  title,
  titlePrefix,
  version,
  toneName,
  toneCustom,
  score,
  difficultyLabel,
  summary,
  good,
  bad,
  observations,
  highlights,
}: ReportDetailClientProps) {
  const { editable } = useViewContext();
  const highlightMap = useMemo(
    () => buildHighlightMap(highlights, slug),
    [highlights, slug],
  );
  const contextValue = useMemo(
    () => ({
      highlightEnabled: false,
      eraseEnabled: false,
      selectedColor: '#f97316',
      editable,
      isSaving: false,
      createHighlight: noop,
      removeHighlight: noop,
    }),
    [editable],
  );

  return (
    <HighlightingProvider value={contextValue}>
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-bold" id={`${idPrefix}-title-${slug}-${userId}`}>
          {titlePrefix ? <span>{titlePrefix} </span> : null}
          <HighlightableText
            as="span"
            id={`${idPrefix}-date-${slug}-${userId}`}
            text={title}
            targetSlug={slug}
            blockId="title"
            highlights={highlightMap.title}
          />
          {version && version > 1 ? <span className="ml-1">(v{version})</span> : null}
        </h1>
        <p className="mb-4 font-semibold">
          <HighlightableText
            as="span"
            id={`${idPrefix}-tone-${slug}-${userId}`}
            text={toneName}
            targetSlug={slug}
            blockId="tone"
            highlights={highlightMap.tone}
          />
          <span className="ml-2">
            Score:{' '}
            <HighlightableText
              as="span"
              id={`${idPrefix}-score-${slug}-${userId}`}
              text={String(score)}
              targetSlug={slug}
              blockId="score"
              highlights={highlightMap.score}
            />
          </span>
          <span className="ml-2">
            <HighlightableText
              as="span"
              id={`${idPrefix}-diff-${slug}-${userId}`}
              text={difficultyLabel}
              targetSlug={slug}
              blockId="difficulty"
              highlights={highlightMap.difficulty}
            />
          </span>
        </p>
        {toneCustom ? (
          <div className="mb-4 rounded-md bg-orange-50 p-4 text-sm text-orange-700">
            <h2 className="font-semibold text-orange-600">Custom coach brief</h2>
            <HighlightableText
              as="p"
              id={`${idPrefix}-tone-custom-${slug}-${userId}`}
              className="mt-2 whitespace-pre-wrap"
              text={toneCustom}
              targetSlug={slug}
              blockId="tone-custom"
              highlights={highlightMap['tone-custom']}
            />
          </div>
        ) : null}
        {summary ? (
          <HighlightableText
            as="p"
            id={`${idPrefix}-sum-${slug}-${userId}`}
            className="whitespace-pre-wrap"
            text={summary}
            targetSlug={slug}
            blockId="summary"
            highlights={highlightMap.summary}
          />
        ) : null}
        {good.length > 0 ? (
          <div className="mt-4" id={`${idPrefix}-good-${slug}-${userId}`}>
            <h2 className="font-semibold">What went well</h2>
            <ul className="list-disc pl-4">
              {good.map((entry, index) => (
                <HighlightableText
                  key={index}
                  as="li"
                  id={`${idPrefix}-good-${index}-${slug}-${userId}`}
                  text={entry}
                  targetSlug={slug}
                  blockId={`good-${index}`}
                  highlights={highlightMap[`good-${index}`]}
                />
              ))}
            </ul>
          </div>
        ) : null}
        {bad.length > 0 ? (
          <div className="mt-4" id={`${idPrefix}-bad-${slug}-${userId}`}>
            <h2 className="font-semibold">What went bad</h2>
            <ul className="list-disc pl-4">
              {bad.map((entry, index) => (
                <HighlightableText
                  key={index}
                  as="li"
                  id={`${idPrefix}-bad-${index}-${slug}-${userId}`}
                  text={entry}
                  targetSlug={slug}
                  blockId={`bad-${index}`}
                  highlights={highlightMap[`bad-${index}`]}
                />
              ))}
            </ul>
          </div>
        ) : null}
        {observations.length > 0 ? (
          <div className="mt-4" id={`${idPrefix}-obs-${slug}-${userId}`}>
            <h2 className="font-semibold">Observations</h2>
            <ul className="list-disc pl-4">
              {observations.map((entry, index) => (
                <HighlightableText
                  key={index}
                  as="li"
                  id={`${idPrefix}-obs-${index}-${slug}-${userId}`}
                  text={entry}
                  targetSlug={slug}
                  blockId={`obs-${index}`}
                  highlights={highlightMap[`obs-${index}`]}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </main>
    </HighlightingProvider>
  );
}
