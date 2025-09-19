'use client';

import { useMemo, useRef, useCallback, type CSSProperties } from 'react';
import clsx from 'clsx';
import { useHighlightingContext } from './highlighting-context';

interface HighlightRange {
  id: number;
  startOffset: number;
  endOffset: number;
  color: string;
  snippet: string;
  createdAt: string;
}

type HighlightElement = 'span' | 'p' | 'h2' | 'li';

interface HighlightableTextProps {
  as?: HighlightElement;
  id?: string;
  className?: string;
  style?: CSSProperties;
  text: string;
  targetSlug: string;
  blockId: string;
  highlights?: HighlightRange[];
}

interface Segment {
  text: string;
  color?: string;
}

function buildSegments(text: string, highlights: HighlightRange[] = []): Segment[] {
  if (!text) return [{ text }];
  if (!highlights || highlights.length === 0) return [{ text }];
  const sorted = [...highlights]
    .map((h) => ({
      ...h,
      startOffset: Math.max(0, Math.min(text.length, h.startOffset)),
      endOffset: Math.max(0, Math.min(text.length, h.endOffset)),
    }))
    .filter((h) => h.endOffset > h.startOffset)
    .sort((a, b) => a.startOffset - b.startOffset);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const h of sorted) {
    if (h.startOffset > cursor) {
      segments.push({ text: text.slice(cursor, h.startOffset) });
    }
    segments.push({
      text: text.slice(h.startOffset, h.endOffset),
      color: h.color,
    });
    cursor = Math.max(cursor, h.endOffset);
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }
  if (segments.length === 0) {
    return [{ text }];
  }
  return segments;
}

function collectTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      nodes.push(current as Text);
    }
    current = walker.nextNode();
  }
  return nodes;
}

function getOffsets(container: HTMLElement, range: Range): { start: number; end: number } | null {
  const textNodes = collectTextNodes(container);
  let start = 0;
  let end = 0;
  let cursor = 0;
  let startFound = false;
  let endFound = false;
  for (const node of textNodes) {
    const length = node.textContent?.length ?? 0;
    if (!startFound && node === range.startContainer) {
      start = cursor + range.startOffset;
      startFound = true;
    }
    if (!endFound && node === range.endContainer) {
      end = cursor + range.endOffset;
      endFound = true;
      break;
    }
    cursor += length;
  }
  if (!startFound || !endFound) return null;
  return { start, end };
}

export default function HighlightableText({
  as: Element = 'span',
  id,
  className,
  style,
  text,
  targetSlug,
  blockId,
  highlights = [],
}: HighlightableTextProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { highlightEnabled, editable, isSaving, createHighlight } =
    useHighlightingContext();

  const segments = useMemo(() => buildSegments(text, highlights), [text, highlights]);

  const handleMouseUp = useCallback(async () => {
    if (!editable || !highlightEnabled || isSaving) return;
    const container = containerRef.current;
    if (!container) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
      return;
    }
    const snippet = selection.toString();
    if (!snippet.trim()) return;
    const offsets = getOffsets(container, range);
    if (!offsets) return;
    selection.removeAllRanges();
    await createHighlight({
      targetSlug,
      blockId,
      startOffset: offsets.start,
      endOffset: offsets.end,
      snippet,
    });
  }, [editable, highlightEnabled, isSaving, targetSlug, blockId, createHighlight]);

  return (
    <Element
      id={id}
      className={clsx(className, {
        'cursor-text': editable && highlightEnabled,
      })}
      style={style}
      ref={(node: HTMLElement | null) => {
        containerRef.current = node;
      }}
      onMouseUp={handleMouseUp}
      data-highlight-block={blockId}
    >
      {segments.map((segment, index) =>
        segment.color ? (
          <span
            key={index}
            className="rounded px-1 py-0.5"
            style={{
              backgroundColor: segment.color,
              color: '#111827',
            }}
          >
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </Element>
  );
}
