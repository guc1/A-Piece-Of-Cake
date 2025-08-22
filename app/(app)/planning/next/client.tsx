'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useViewContext } from '@/lib/view-context';
import PlanningDateNav from './date-nav';
import type { Plan, PlanBlock, PlanBlockInput } from '@/types/plan';
import type { Ingredient } from '@/types/ingredient';
import { savePlanAction } from './actions';

const COLORS = [
  '#F87171',
  '#FBBF24',
  '#34D399',
  '#60A5FA',
  '#A78BFA',
  '#F472B6',
  '#FB923C',
  '#4ADE80',
  '#2DD4BF',
  '#94A3B8',
];

function iconSrc(ic: string) {
  if (ic.startsWith('data:')) return ic;
  if (/^[A-Za-z0-9+/=]+$/.test(ic)) return `data:image/png;base64,${ic}`;
  return null;
}

// shrink timeline so 24h fits on one screen
const BASE_PIXELS_PER_MINUTE = 0.5;
const TIMELINE_HEIGHT = 24 * 60 * BASE_PIXELS_PER_MINUTE; // full-day height
const MAX_MINUTES = 24 * 60; // minutes in a day
const DEFAULT_START = 5 * 60; // 05:00
const DEFAULT_END = 22 * 60; // 22:00
const Z_BASE = 10000;

interface Props {
  userId: string;
  date: string; // plan date YYYY-MM-DD
  today: string; // today's date YYYY-MM-DD
  tz: string;
  initialPlan: Plan | null;
  ingredients?: Ingredient[];
  live?: boolean;
  review?: boolean;
}

export default function EditorClient({
  userId,
  date,
  today,
  tz,
  initialPlan,
  ingredients: initialIngredients = [],
  live = false,
  review = false,
}: Props) {
  const { editable, viewId } = useViewContext();
  const mode = live ? 'live' : 'next';
  // Persist plans per-user and per-date. Live and review modes share the
  // same key while future planning uses its own so adjustments remain across
  // calendar days even if the network request fails.
  const storageKey = `${live || review ? 'live' : 'next'}-plan-${userId}-${date}`;
  const reviewKey = `review-${userId}-${date}`;
  const vibeKey = `review-vibe-${userId}-${date}`;
  const [blocks, setBlocks] = useState<PlanBlock[]>(() => {
    if (editable && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw)
          return (JSON.parse(raw) as PlanBlock[]).map((b) => ({
            ...b,
            ingredientIds: b.ingredientIds ?? [],
          }));
      } catch {
        // ignore malformed data
      }
    }
    return (initialPlan?.blocks ?? []).map((b) => ({
      ...b,
      ingredientIds: b.ingredientIds ?? [],
    }));
  });
  const [reviews, setReviews] = useState<
    Record<string, { good: string; bad: string }>
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(reviewKey);
        if (raw)
          return JSON.parse(raw) as Record<
            string,
            { good: string; bad: string }
          >;
      } catch {
        // ignore malformed data
      }
    }
    return {};
  });
  const [vibe, setVibe] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(vibeKey);
        if (raw) return raw;
      } catch {
        // ignore
      }
    }
    return '';
  });
  const [showVibe, setShowVibe] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => blocks.find((b) => b.id === selectedId) || null,
    [blocks, selectedId],
  );
  const draggingRef = useRef(false);
  const [startMinute, setStartMinute] = useState(DEFAULT_START);
  const [endMinute, setEndMinute] = useState(DEFAULT_END);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(minutesToTime(DEFAULT_START));
  const [customEnd, setCustomEnd] = useState(minutesToTime(DEFAULT_END));
  const visibleMinutes = endMinute - startMinute;
  const PIXELS_PER_MINUTE = TIMELINE_HEIGHT / visibleMinutes;
  const startHour = Math.floor(startMinute / 60);
  const endHour = Math.ceil(endMinute / 60);

  const [nowMinute, setNowMinute] = useState(() => {
    if (!live) return 0;
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    if (!live) return;
    const tick = () => {
      const d = new Date();
      setNowMinute(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [live]);

  useEffect(() => {
    if (!live) return;
    if (nowMinute < startMinute) setStartMinute(0);
    if (nowMinute > endMinute) setEndMinute(MAX_MINUTES);
  }, [live, nowMinute, startMinute, endMinute]);

  // Refresh when the calendar day changes in the user's timezone so the
  // planner always targets the correct date (live vs. next day).
  useEffect(() => {
    const check = () => {
      fetch(`/api/clock?tz=${encodeURIComponent(tz)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ymd !== today) {
            window.location.reload();
          }
        })
        .catch(() => {});
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [tz, today]);

  useEffect(() => {
    try {
      window.localStorage.setItem(reviewKey, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }, [reviews, reviewKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(vibeKey, vibe);
    } catch {
      // ignore
    }
  }, [vibe, vibeKey]);

  useEffect(() => {
    if (!review) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          setBlocks(JSON.parse(e.newValue) as PlanBlock[]);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [review, storageKey]);

  const minutesFromIso = useCallback(
    (iso: string) => {
      const base = new Date(`${date}T00:00:00`);
      const diff = Math.round(
        (new Date(iso).getTime() - base.getTime()) / 60000,
      );
      return Math.max(0, Math.min(diff, MAX_MINUTES));
    },
    [date],
  );
  const formatTime = useCallback(
    (iso: string) => {
      const diff = minutesFromIso(iso);
      const h = String(Math.floor(diff / 60)).padStart(2, '0');
      const m = String(diff % 60).padStart(2, '0');
      return `${h}:${m}`;
    },
    [minutesFromIso],
  );
  function minutesToTime(min: number) {
    const h = String(Math.floor(min / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    return `${h}:${m}`;
  }
  function isoFromMinutes(min: number) {
    const base = new Date(`${date}T00:00:00`);
    return new Date(base.getTime() + min * 60000).toISOString();
  }

  useEffect(() => {
    if (!review) return;
    setReviews((prev) => {
      const ids = new Set(blocks.map((b) => b.id));
      const next: Record<string, { good: string; bad: string }> = { ...prev };
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) delete next[id];
      }
      return next;
    });
  }, [blocks, review]);

  useEffect(() => {
    if (!review) return;
    const now = nowMinute;
    setReviews((prev) => {
      const next: Record<string, { good: string; bad: string }> = { ...prev };
      for (const b of blocks) {
        if (minutesFromIso(b.end) > now && next[b.id]) {
          delete next[b.id];
        }
      }
      return next;
    });
  }, [nowMinute, blocks, review, minutesFromIso]);

  function updateBlock(id: string, updates: Partial<PlanBlock>) {
    if (review) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
  }

  function removeIngredient(blockId: string, ingredientId: number) {
    const blk = blocks.find((b) => b.id === blockId);
    if (!blk) return;
    updateBlock(blockId, {
      ingredientIds: blk.ingredientIds.filter((id) => id !== ingredientId),
    });
  }

  function addBlock() {
    if (!editable || review) return;
    const sorted = [...blocks].sort(
      (a, b) => minutesFromIso(a.start) - minutesFromIso(b.start),
    );
    function isFree(s: number, e: number) {
      return !sorted.some(
        (b) =>
          Math.max(s, minutesFromIso(b.start)) <
          Math.min(e, minutesFromIso(b.end)),
      );
    }

    let candidate: number | null = null;
    let duration = 60;

    const findSlot = (dur: number) => {
      let c = startMinute;
      while (c + dur <= endMinute) {
        if (isFree(c, c + dur)) return c;
        c += 15;
      }
      return null;
    };

    candidate = findSlot(60);
    if (candidate === null) {
      const small = findSlot(30);
      if (small !== null) {
        duration = 30;
        candidate = small;
      }
    }

    if (candidate === null) {
      const maxStart = endMinute - duration;
      if (maxStart <= startMinute) {
        candidate = startMinute;
      } else {
        const steps = Math.floor((maxStart - startMinute) / 15);
        candidate = startMinute + Math.floor(Math.random() * (steps + 1)) * 15;
      }
    }

    if (candidate === null) {
      alert('No 1-hour slot available.');
      return;
    }

    // candidate is guaranteed to be set here
    const start = candidate as number;
    const id = crypto.randomUUID();
    const newBlock: PlanBlock = {
      id,
      planId: initialPlan?.id || '',
      start: isoFromMinutes(start),
      end: isoFromMinutes(start + duration),
      title: '',
      description: '',
      color: COLORS[0],
      ingredientIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBlocks((b) => [...b, newBlock]);
    setSelectedId(id);
  }

  const lastSaved = useRef(JSON.stringify(blocks));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // When navigating between dates or users, refresh the block list so it
  // matches the server-provided plan (or cached local copy) without requiring
  // a full page reload.
  useEffect(() => {
    let fromStorage: PlanBlock[] | null = null;
    if (editable && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) fromStorage = JSON.parse(raw) as PlanBlock[];
      } catch {
        // ignore malformed data
      }
    }
    const next = fromStorage ?? initialPlan?.blocks ?? [];
    const serialized = JSON.stringify(next);
    if (serialized !== lastSaved.current) {
      setBlocks(next);
      lastSaved.current = serialized;
    }
    if (editable && !fromStorage) {
      try {
        window.localStorage.setItem(storageKey, serialized);
      } catch {
        // ignore write errors
      }
    }
  }, [editable, storageKey, initialPlan]);

  useEffect(() => {
    if (!editable || review) return;
    const serialized = JSON.stringify(blocks);
    if (serialized === lastSaved.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (live) {
        window.localStorage.setItem(storageKey, serialized);
        lastSaved.current = serialized;
      } else {
        const payload: PlanBlockInput[] = blocks.map((b) => ({
          id: b.id,
          start: b.start,
          end: b.end,
          title: b.title,
          description: b.description,
          color: b.color,
          ingredientIds: b.ingredientIds,
        }));
        savePlanAction(date, payload).then((plan) => {
          setBlocks(plan.blocks);
          const ser = JSON.stringify(plan.blocks);
          lastSaved.current = ser;
          try {
            window.localStorage.setItem(storageKey, ser);
          } catch {
            // ignore write errors
          }
        });
      }
      saveTimer.current = null;
    }, 500);
  }, [blocks, date, editable, live, storageKey, review]);

  useEffect(() => {
    if (!editable || review) return;
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        if (live) {
          const serialized = JSON.stringify(blocksRef.current);
          window.localStorage.setItem(storageKey, serialized);
          lastSaved.current = serialized;
        } else {
          const payload: PlanBlockInput[] = blocksRef.current.map((b) => ({
            id: b.id,
            start: b.start,
            end: b.end,
            title: b.title,
            description: b.description,
            color: b.color,
            ingredientIds: b.ingredientIds,
          }));
          void savePlanAction(date, payload).then((plan) => {
            const ser = JSON.stringify(plan.blocks);
            lastSaved.current = ser;
            try {
              window.localStorage.setItem(storageKey, ser);
            } catch {
              // ignore write errors
            }
          });
        }
      }
    };
  }, [date, editable, live, storageKey, review]);

  function handleTimeChange(id: string, field: 'start' | 'end', value: string) {
    if (review) return;
    const [h, m] = value.split(':').map((n) => parseInt(n, 10));
    const minutes = h * 60 + m;
    if (field === 'start') {
      const dur =
        minutesFromIso(selected!.end) - minutesFromIso(selected!.start);
      const maxStart = Math.max(0, MAX_MINUTES - dur);
      const newStart = Math.min(Math.max(minutes, 0), maxStart);
      updateBlock(id, {
        start: isoFromMinutes(newStart),
        end: isoFromMinutes(newStart + dur),
      });
    } else {
      const newEnd = Math.min(
        Math.max(minutes, minutesFromIso(selected!.start) + 15),
        MAX_MINUTES,
      );
      updateBlock(id, { end: isoFromMinutes(newEnd) });
    }
  }

  function applyCustomRange() {
    const [sh, sm] = customStart.split(':').map((n) => parseInt(n, 10));
    const [eh, em] = customEnd.split(':').map((n) => parseInt(n, 10));
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (isNaN(start) || isNaN(end) || start >= end) {
      alert('Invalid time range');
      return;
    }
    setStartMinute(Math.max(0, Math.min(start, MAX_MINUTES)));
    setEndMinute(Math.max(0, Math.min(end, MAX_MINUTES)));
    setShowCustom(false);
  }

  function onDragStart(
    e: React.PointerEvent,
    b: PlanBlock,
    mode: 'move' | 'start' | 'end',
    dragRef: React.MutableRefObject<boolean>,
  ) {
    if (!editable || review) return;
    e.preventDefault();
    dragRef.current = false;
    const startY = e.clientY;
    const initStart = minutesFromIso(b.start);
    const initEnd = minutesFromIso(b.end);
    const bounds = document
      .getElementById(`p1an-timecol-${userId}`)
      ?.getBoundingClientRect() ?? { top: 0, bottom: 0 };
    const marginPx = 10; // drop a little early to avoid glitches at edges
    function onMove(ev: PointerEvent) {
      dragRef.current = true;
      if (
        ev.clientY < bounds.top + marginPx ||
        ev.clientY > bounds.bottom - marginPx
      ) {
        onUp();
        return;
      }
      const delta =
        Math.round((ev.clientY - startY) / PIXELS_PER_MINUTE / 15) * 15;
      const rawStart = initStart + delta;
      const rawEnd = initEnd + delta;
      if (mode === 'move') {
        let newStart = rawStart;
        newStart = Math.max(
          0,
          Math.min(newStart, MAX_MINUTES - (initEnd - initStart)),
        );
        updateBlock(b.id, {
          start: isoFromMinutes(newStart),
          end: isoFromMinutes(newStart + (initEnd - initStart)),
        });
      } else if (mode === 'start') {
        let newStart = rawStart;
        newStart = Math.max(0, Math.min(newStart, initEnd - 15));
        updateBlock(b.id, { start: isoFromMinutes(newStart) });
      } else {
        let newEnd = rawEnd;
        newEnd = Math.max(initStart + 15, Math.min(newEnd, MAX_MINUTES));
        updateBlock(b.id, { end: isoFromMinutes(newEnd) });
      }
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  const sortedBlocks = useMemo(
    () =>
      [...blocks].sort(
        (a, b) => minutesFromIso(a.start) - minutesFromIso(b.start),
      ),
    [blocks, minutesFromIso],
  );

  const blockDepth = useMemo(() => {
    const depthMap: Record<string, number> = {};
    const starts = sortedBlocks.map((b) => minutesFromIso(b.start));
    const ends = sortedBlocks.map((b) => minutesFromIso(b.end));
    sortedBlocks.forEach((b, i) => {
      const bStart = starts[i];
      const bEnd = ends[i];
      let depth = 0;
      sortedBlocks.forEach((o, j) => {
        if (i === j) return;
        if (starts[j] <= bStart && ends[j] >= bEnd) depth++;
      });
      depthMap[b.id] = depth;
    });
    return depthMap;
  }, [sortedBlocks, minutesFromIso]);

  const liveBlocks = useMemo(() => {
    if (!live) return [] as PlanBlock[];
    return blocks.filter((b) => {
      const s = minutesFromIso(b.start);
      const e = minutesFromIso(b.end);
      return s <= nowMinute && nowMinute < e;
    });
  }, [blocks, minutesFromIso, nowMinute, live]);

  const currentBlock = useMemo(() => {
    if (!liveBlocks.length) return null;
    return liveBlocks.reduce(
      (latest, b) =>
        minutesFromIso(b.start) > minutesFromIso(latest.start) ? b : latest,
      liveBlocks[0],
    );
  }, [liveBlocks, minutesFromIso]);

  useEffect(() => {
    if (!live) return;
    if (currentBlock) setSelectedId(currentBlock.id);
    else setSelectedId(null);
  }, [live, currentBlock]);

  const lineColor = useMemo(() => {
    if (!live) return '#FF0000';
    const overRed = blocks.some((b) => {
      const s = minutesFromIso(b.start);
      const e = minutesFromIso(b.end);
      return s <= nowMinute && nowMinute < e && b.color === '#F87171';
    });
    return overRed ? '#0000FF' : '#FF0000';
  }, [blocks, minutesFromIso, nowMinute, live]);

  return (
    <>
      <div className="flex h-full">
        <div
          className={`relative overflow-y-hidden ${selected ? 'w-1/2' : 'w-full'}`}
          id={`p1an-timecol-${userId}`}
          onPointerDown={() => setSelectedId(null)}
        >
          <div
            className="sticky top-0 z-10 flex flex-wrap items-center gap-2 bg-gray-100 p-2 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {review ? (
              editable ? (
                <Button
                  id={`p1an-vibe-open-${userId}`}
                  onClick={() => setShowVibe(true)}
                  size="sm"
                  className="shadow"
                >
                  Write general day vibe
                </Button>
              ) : (
                <Button
                  id={`p1an-vibe-open-${userId}`}
                  size="sm"
                  className="shadow"
                  disabled
                  title="Read-only in viewing mode"
                >
                  Write general day vibe
                </Button>
              )
            ) : editable ? (
              <button
                id={`p1an-add-top-${userId}`}
                onClick={() => addBlock()}
                disabled={!editable}
                className="rounded border px-2 py-1"
              >
                + Add timeslot
              </button>
            ) : (
              <button
                id={`p1an-add-top-${userId}`}
                className="rounded border px-2 py-1"
                disabled
                title="Read-only in viewing mode"
              >
                + Add timeslot
              </button>
            )}
            <button
              id={`p1an-range-btn-${userId}`}
              className="rounded border px-2 py-1"
              onClick={() => setShowCustom((s) => !s)}
            >
              Add custom time
            </button>
            {startMinute > 0 && (
              <button
                id={`p1an-load-early-${userId}`}
                className="rounded border px-2 py-1"
                onClick={() => setStartMinute(0)}
              >
                Load earlier
              </button>
            )}
            {endMinute < MAX_MINUTES && (
              <button
                id={`p1an-load-late-${userId}`}
                className="rounded border px-2 py-1"
                onClick={() => setEndMinute(MAX_MINUTES)}
              >
                Load later
              </button>
            )}
            {(startMinute !== DEFAULT_START || endMinute !== DEFAULT_END) && (
              <button
                id={`p1an-close-range-${userId}`}
                className="rounded border px-2 py-1"
                onClick={() => {
                  setStartMinute(DEFAULT_START);
                  setEndMinute(DEFAULT_END);
                }}
              >
                Close
              </button>
            )}
            <PlanningDateNav date={date} today={today} />
          </div>
          {showCustom && (
            <div
              className="sticky top-[48px] z-10 flex items-center gap-2 bg-gray-50 p-2 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Start:</span>
              <input
                type="time"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border p-1"
              />
              <span>End:</span>
              <input
                type="time"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border p-1"
              />
              <button
                className="rounded border px-2 py-1"
                onClick={applyCustomRange}
              >
                Apply
              </button>
            </div>
          )}
          <div style={{ height: TIMELINE_HEIGHT }} className="relative">
            <div className="absolute left-0 top-0 w-12">
              {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                const h = startHour + i;
                const translate =
                  h === startHour ? '0' : h === endHour ? '-100%' : '-50%';
                return (
                  <span
                    key={h}
                    className="absolute right-1 text-[10px] text-gray-500"
                    style={{
                      top: (h * 60 - startMinute) * PIXELS_PER_MINUTE,
                      transform: `translateY(${translate})`,
                    }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </span>
                );
              })}
            </div>
            <div className="absolute left-12 right-0 top-0">
              {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                const h = startHour + i;
                return (
                  <div key={h}>
                    <div
                      id={`p1an-hour-${h}-${userId}`}
                      className="absolute left-0 right-0 border-t border-gray-300"
                      style={{
                        top: (h * 60 - startMinute) * PIXELS_PER_MINUTE,
                      }}
                    />
                    {h < endHour &&
                      [15, 30, 45].map((m) => (
                        <div
                          key={m}
                          className="absolute left-0 right-0 border-t border-gray-100"
                          style={{
                            top: (h * 60 + m - startMinute) * PIXELS_PER_MINUTE,
                          }}
                        />
                      ))}
                  </div>
                );
              })}
              {sortedBlocks.map((b) => {
                const bStart = minutesFromIso(b.start);
                const bEnd = minutesFromIso(b.end);
                if (bEnd <= startMinute || bStart >= endMinute) return null;
                const top =
                  (Math.max(bStart, startMinute) - startMinute) *
                  PIXELS_PER_MINUTE;
                const height =
                  (Math.min(bEnd, endMinute) - Math.max(bStart, startMinute)) *
                  PIXELS_PER_MINUTE;
                const z = (blockDepth[b.id] || 0) * Z_BASE + (Z_BASE - bStart);
                const textColor = '#000000';
                return (
                  <div
                    key={b.id}
                    id={`p1an-blk-${b.id}-${userId}`}
                    data-selected={selectedId === b.id ? 'true' : 'false'}
                    aria-label={`${b.title}, ${b.start} to ${b.end}`}
                    className="absolute left-1 right-1 rounded p-1 text-xs"
                    style={{
                      top,
                      height,
                      background: b.color,
                      zIndex: z,
                      color: textColor,
                      cursor: review
                        ? !live || nowMinute >= minutesFromIso(b.end)
                          ? 'pointer'
                          : 'not-allowed'
                        : editable
                          ? 'move'
                          : 'default',
                    }}
                    onPointerMove={(e) => {
                      if (!editable || review) return;
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      const offset = e.clientY - rect.top;
                      (e.currentTarget as HTMLElement).style.cursor =
                        offset < 8 || rect.height - offset < 8
                          ? 'ns-resize'
                          : 'move';
                    }}
                    onPointerLeave={(e) => {
                      if (!editable || review) return;
                      (e.currentTarget as HTMLElement).style.cursor = 'move';
                    }}
                    onPointerDown={(e) => {
                      if (!editable || review) return;
                      e.stopPropagation();
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      const offset = e.clientY - rect.top;
                      const mode =
                        offset < 8
                          ? 'start'
                          : rect.height - offset < 8
                            ? 'end'
                            : 'move';
                      onDragStart(e, b, mode, draggingRef);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (draggingRef.current) return;
                      if (review && live && nowMinute < minutesFromIso(b.end))
                        return;
                      setSelectedId(b.id);
                    }}
                  >
                    <span className="pointer-events-none block truncate">
                      {b.title}
                    </span>
                  </div>
                );
              })}
              {live && nowMinute >= startMinute && nowMinute <= endMinute && (
                <div
                  id={`p1an-now-${userId}`}
                  className="pointer-events-none absolute left-0 right-0 border-t-2 border-dotted"
                  style={{
                    top: (nowMinute - startMinute) * PIXELS_PER_MINUTE,
                    borderColor: lineColor,
                    zIndex: 999999,
                  }}
                >
                  <div
                    className="absolute -left-2 -top-1 h-2 w-2 rounded-full"
                    style={{ background: lineColor }}
                  />
                </div>
              )}
            </div>
          </div>
          {!review &&
            (editable ? (
              <button
                id={`p1an-add-fab-${userId}`}
                onClick={(e) => {
                  e.stopPropagation();
                  addBlock();
                }}
                className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-orange-500 text-white"
                disabled={!editable}
              >
                +
              </button>
            ) : (
              <button
                id={`p1an-add-fab-${userId}`}
                className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-orange-500 text-white"
                disabled
                title="Read-only in viewing mode"
              >
                +
              </button>
            ))}
        </div>
        {selected ? (
          <div
            className="w-1/2 border-l p-4"
            id={`p1an-meta-${selected.id}-${userId}`}
          >
            {review ? (
              <>
                <div className="mb-2 text-sm text-gray-500">
                  {editable ? null : 'Read-only (viewing mode)'}
                </div>
                <label
                  className="block text-sm font-medium"
                  htmlFor={`p1an-meta-good-${selected.id}-${userId}`}
                >
                  What went good?
                </label>
                <textarea
                  id={`p1an-meta-good-${selected.id}-${userId}`}
                  className="mb-2 w-full border p-1"
                  value={reviews[selected.id]?.good ?? ''}
                  disabled={!editable}
                  maxLength={1000}
                  rows={6}
                  onChange={(e) =>
                    setReviews((prev) => ({
                      ...prev,
                      [selected.id]: {
                        ...(prev[selected.id] || { good: '', bad: '' }),
                        good: e.target.value,
                      },
                    }))
                  }
                />
                <label
                  className="block text-sm font-medium"
                  htmlFor={`p1an-meta-bad-${selected.id}-${userId}`}
                >
                  What went bad?
                </label>
                <textarea
                  id={`p1an-meta-bad-${selected.id}-${userId}`}
                  className="mb-2 w-full border p-1"
                  value={reviews[selected.id]?.bad ?? ''}
                  disabled={!editable}
                  maxLength={1000}
                  rows={6}
                  onChange={(e) =>
                    setReviews((prev) => ({
                      ...prev,
                      [selected.id]: {
                        ...(prev[selected.id] || { good: '', bad: '' }),
                        bad: e.target.value,
                      },
                    }))
                  }
                />
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    id={`p1an-meta-close-${userId}`}
                    onClick={() => setSelectedId(null)}
                  >
                    X
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 text-sm text-gray-500">
                  {editable ? null : 'Read-only (viewing mode)'}
                </div>
                <label
                  className="block text-sm font-medium"
                  htmlFor={`p1an-meta-ttl-${selected.id}-${userId}`}
                >
                  Activity
                </label>
                <input
                  id={`p1an-meta-ttl-${selected.id}-${userId}`}
                  className="mb-2 w-full border p-1"
                  value={selected.title}
                  maxLength={60}
                  disabled={!editable}
                  onChange={(e) =>
                    updateBlock(selected.id, { title: e.target.value })
                  }
                />
                <label
                  className="block text-sm font-medium"
                  htmlFor={`p1an-meta-dsc-${selected.id}-${userId}`}
                >
                  Description
                </label>
                <textarea
                  id={`p1an-meta-dsc-${selected.id}-${userId}`}
                  className="mb-2 w-full border p-1"
                  value={selected.description}
                  disabled={!editable}
                  maxLength={500}
                  rows={6}
                  onChange={(e) =>
                    updateBlock(selected.id, { description: e.target.value })
                  }
                />
                <label className="block text-sm font-medium">Color</label>
                <div
                  id={`p1an-meta-col-${selected.id}-${userId}`}
                  className="mb-2 flex flex-wrap gap-1"
                >
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className="h-6 w-6 rounded"
                      style={{ background: c }}
                      onClick={() =>
                        editable && updateBlock(selected.id, { color: c })
                      }
                      disabled={!editable}
                    />
                  ))}
                </div>
                <div className="mb-2 flex gap-2">
                  <div>
                    <label
                      className="block text-sm font-medium"
                      htmlFor={`p1an-meta-tms-${selected.id}-${userId}`}
                    >
                      Start
                    </label>
                    <input
                      type="time"
                      id={`p1an-meta-tms-${selected.id}-${userId}`}
                      value={formatTime(selected.start)}
                      disabled={!editable}
                      onChange={(e) =>
                        handleTimeChange(selected.id, 'start', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium"
                      htmlFor={`p1an-meta-tme-${selected.id}-${userId}`}
                    >
                      End
                    </label>
                    <input
                      type="time"
                      id={`p1an-meta-tme-${selected.id}-${userId}`}
                      value={formatTime(selected.end)}
                      disabled={!editable}
                      onChange={(e) =>
                        handleTimeChange(selected.id, 'end', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Ingredients
                  </label>
                  <div
                    id={`p1an-meta-igrd-${selected.id}-${userId}`}
                    className="mb-2 flex flex-wrap gap-2"
                  >
                    {(selected.ingredientIds ?? []).map((iid) => {
                      const ing = initialIngredients.find((i) => i.id === iid);
                      const src = ing?.icon ? iconSrc(ing.icon) : null;
                      return (
                        <Link
                          key={iid}
                          href={
                            viewId
                              ? `/view/${viewId}/ingredient/${ing?.id ?? ''}`
                              : `/ingredient/${ing?.id ?? ''}`
                          }
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow"
                        >
                          {src ? (
                            <img src={src} alt="" className="h-4 w-4" />
                          ) : (
                            <span>{ing?.icon ?? '❓'}</span>
                          )}
                          <span className="text-sm">
                            {ing?.title ?? 'Unknown'}
                          </span>
                          {editable && (
                            <span
                              className="ml-1 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeIngredient(selected.id, iid);
                              }}
                            >
                              ×
                            </span>
                          )}
                        </Link>
                      );
                    })}
                    {editable && (
                      <Link
                        id={`p1an-meta-igrd-add-${selected.id}-${userId}`}
                        href={`/ingredientsforplanning?date=${date}&block=${selected.id}&mode=${mode}`}
                        className="rounded-full bg-green-200 px-3 py-1 text-green-800 shadow"
                      >
                        Add ingredients +
                      </Link>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {editable ? (
                    <Button
                      variant="outline"
                      className="border-red-600 text-red-600"
                      id={`p1an-meta-del-${userId}`}
                      onClick={() => {
                        setBlocks((prev) =>
                          prev.filter((blk) => blk.id !== selected.id),
                        );
                        setSelectedId(null);
                      }}
                    >
                      Delete
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-red-600 text-red-600"
                      id={`p1an-meta-del-${userId}`}
                      disabled
                      title="Read-only in viewing mode"
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    id={`p1an-meta-close-${userId}`}
                    onClick={() => setSelectedId(null)}
                  >
                    X
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
      {showVibe && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur">
          <div className="w-96 rounded bg-white p-4 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold">Write general vibe</h2>
            <textarea
              id={`p1an-vibe-${userId}`}
              className="w-full border p-1"
              value={vibe}
              maxLength={1000}
              rows={8}
              disabled={!editable}
              onChange={(e) => setVibe(e.target.value)}
            />
            <div className="mt-2 text-right">
              <Button
                variant="outline"
                id={`p1an-vibe-close-${userId}`}
                onClick={() => setShowVibe(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
