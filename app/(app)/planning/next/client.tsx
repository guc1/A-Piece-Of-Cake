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
import { cn } from '@/lib/utils';
import ColorPresetPicker from '@/components/color-preset-picker';
import { addUserColorPreset, getUserColorPresets } from '@/lib/color-presets';

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
  initialShowDailyAim?: boolean;
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
  initialShowDailyAim = false,
}: Props) {
  const { editable, viewId, viewerId } = useViewContext();
  // Viewer id is null when editing own plan; otherwise it represents the
  // currently logged-in user. This helper simplifies targeting the correct
  // storage key for color presets in both owner and viewer modes.
  const currentUserId = viewerId !== null ? String(viewerId) : userId;
  const mode = live ? 'live' : 'next';
  // Persist plans per-user and per-date. Live and review modes share the
  // same key while future planning uses its own so adjustments remain across
  // calendar days even if the network request fails.
  const storageKey = `${live || review ? 'live' : 'next'}-plan-${userId}-${date}`;
  const reviewKey = `review-${userId}-${date}`;
  const [blocks, setBlocks] = useState<PlanBlock[]>(() => {
    if (editable && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw)
          return (JSON.parse(raw) as PlanBlock[]).map((b) => ({
            ...b,
            ingredientIds: b.ingredientIds ?? [],
            colorPreset: b.colorPreset ?? '',
          }));
      } catch {
        // ignore malformed data
      }
    }
    return (initialPlan?.blocks ?? []).map((b) => ({
      ...b,
      ingredientIds: b.ingredientIds ?? [],
      colorPreset: b.colorPreset ?? '',
    }));
  });
  const foreignPresets = useMemo(() => {
    if (initialPlan?.colorPresets && initialPlan.colorPresets.length > 0) {
      return initialPlan.colorPresets.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.colors[0],
      }));
    }
    const map = new Map<string, string>();
    for (const b of blocks) {
      if (b.colorPreset && b.color && !map.has(b.colorPreset)) {
        map.set(b.colorPreset, b.color);
      }
    }
    return Array.from(map.entries()).map(([name, color]) => ({
      name,
      color,
    }));
  }, [blocks, initialPlan?.colorPresets]);
  const [dailyAim, setDailyAim] = useState(() => initialPlan?.dailyAim ?? '');
  const [dailyIngredientIds, setDailyIngredientIds] = useState<number[]>(
    () => initialPlan?.dailyIngredientIds ?? [],
  );
  const [showDailyAim, setShowDailyAim] = useState(initialShowDailyAim);
  const hasDailyAim = useMemo(
    () => dailyAim.trim().length > 0 || dailyIngredientIds.length > 0,
    [dailyAim, dailyIngredientIds],
  );
  useEffect(() => {
    if (!initialShowDailyAim) return;
    setShowDailyAim(true);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          dailyAim?: string;
          dailyIngredientIds?: number[];
        };
        if (typeof parsed.dailyAim === 'string') setDailyAim(parsed.dailyAim);
        if (Array.isArray(parsed.dailyIngredientIds))
          setDailyIngredientIds(parsed.dailyIngredientIds);
      }
    } catch {
      // ignore
    }
  }, [initialShowDailyAim, storageKey]);
  const [reviews, setReviews] = useState<
    Record<
      string,
      { good: string; bad: string; ingredients: Record<number, string> }
    >
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(reviewKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<
            string,
            { good: string; bad: string; ingredients?: Record<number, string> }
          >;
          for (const k of Object.keys(parsed)) {
            parsed[k].ingredients = parsed[k].ingredients ?? {};
          }
          return parsed as Record<
            string,
            { good: string; bad: string; ingredients: Record<number, string> }
          >;
        }
      } catch {
        // ignore malformed data
      }
    }
    return {};
  });
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => blocks.find((b) => b.id === selectedId) || null,
    [blocks, selectedId],
  );
  const [selectIngredient, setSelectIngredient] = useState(false);
  useEffect(() => {
    setSelectIngredient(false);
  }, [selectedId]);
  const unreviewedIngredientIds = useMemo(() => {
    if (!selected) return [] as number[];
    const reviewed = reviews[selected.id]?.ingredients || {};
    return (selected.ingredientIds ?? []).filter((iid) => !(iid in reviewed));
  }, [selected, reviews]);
  const [selectDailyIngredient, setSelectDailyIngredient] = useState(false);
  useEffect(() => {
    if (!showDailyAim) {
      setSelectDailyIngredient(false);
      if (typeof document !== 'undefined') document.body.style.overflow = '';
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showDailyAim]);
  const unreviewedDailyIngredientIds = useMemo(() => {
    const reviewed = reviews['day']?.ingredients || {};
    return dailyIngredientIds.filter((iid) => !(iid in reviewed));
  }, [dailyIngredientIds, reviews]);
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
      const next: Record<
        string,
        { good: string; bad: string; ingredients: Record<number, string> }
      > = {
        ...prev,
      };
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
      const next: Record<
        string,
        { good: string; bad: string; ingredients: Record<number, string> }
      > = {
        ...prev,
      };
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

  function removeDailyIngredient(ingredientId: number) {
    setDailyIngredientIds((ids) => ids.filter((id) => id !== ingredientId));
  }

  function addIngredientReview(blockId: string, ingredientId: number) {
    setReviews((prev) => ({
      ...prev,
      [blockId]: {
        ...(prev[blockId] || { good: '', bad: '', ingredients: {} }),
        ingredients: {
          ...(prev[blockId]?.ingredients || {}),
          [ingredientId]: '',
        },
      },
    }));
  }

  function removeIngredientReview(blockId: string, ingredientId: number) {
    setReviews((prev) => {
      const copy = { ...prev };
      const entry = copy[blockId];
      if (entry) {
        const ing = { ...entry.ingredients };
        delete ing[ingredientId];
        copy[blockId] = { ...entry, ingredients: ing };
      }
      return copy;
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
      colorPreset: '',
      ingredientIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBlocks((b) => [...b, newBlock]);
    setSelectedId(id);
  }

  const lastSaved = useRef(
    JSON.stringify({ blocks, dailyAim, dailyIngredientIds }),
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksRef = useRef(blocks);
  const dailyAimRef = useRef(dailyAim);
  const dailyIngredientIdsRef = useRef(dailyIngredientIds);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);
  useEffect(() => {
    dailyAimRef.current = dailyAim;
  }, [dailyAim]);
  useEffect(() => {
    dailyIngredientIdsRef.current = dailyIngredientIds;
  }, [dailyIngredientIds]);

  // When navigating between dates or users, refresh the block list so it
  // matches the server-provided plan (or cached local copy) without requiring
  // a full page reload.
  useEffect(() => {
    let fromStorage: {
      blocks?: PlanBlock[];
      dailyAim?: string;
      dailyIngredientIds?: number[];
    } | null = null;
    if (editable && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          fromStorage = Array.isArray(parsed) ? { blocks: parsed } : parsed;
        }
      } catch {
        // ignore malformed data
      }
    }
    const nextBlocks = (fromStorage?.blocks ?? initialPlan?.blocks ?? []).map(
      (b) => ({
        ...b,
        ingredientIds: b.ingredientIds ?? [],
        colorPreset: b.colorPreset ?? '',
      }),
    );
    const nextAim = fromStorage?.dailyAim ?? initialPlan?.dailyAim ?? '';
    const nextIng =
      fromStorage?.dailyIngredientIds ?? initialPlan?.dailyIngredientIds ?? [];
    const serialized = JSON.stringify({
      blocks: nextBlocks,
      dailyAim: nextAim,
      dailyIngredientIds: nextIng,
    });
    if (serialized !== lastSaved.current) {
      setBlocks(nextBlocks);
      setDailyAim(nextAim);
      setDailyIngredientIds(nextIng);
      lastSaved.current = serialized;
    }
    if (editable && !fromStorage) {
      try {
        window.localStorage.setItem(storageKey, serialized);
      } catch {
        // ignore write errors
      }
    }
  }, [editable, storageKey, initialPlan, date]);

  useEffect(() => {
    if (!editable || review) return;
    const serialized = JSON.stringify({
      blocks,
      dailyAim,
      dailyIngredientIds,
    });
    if (serialized === lastSaved.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload: PlanBlockInput[] = blocks.map((b) => ({
        id: b.id,
        start: b.start,
        end: b.end,
        title: b.title,
        description: b.description,
        color: b.color,
        colorPreset: b.colorPreset,
        ingredientIds: b.ingredientIds,
      }));
      const presetsSnapshot = getUserColorPresets(userId);
      savePlanAction(
        date,
        payload,
        dailyAim,
        dailyIngredientIds,
        presetsSnapshot,
      ).then(
        (plan) => {
          setBlocks(plan.blocks);
          setDailyAim(plan.dailyAim);
          setDailyIngredientIds(plan.dailyIngredientIds);
          const ser = JSON.stringify({
            blocks: plan.blocks,
            dailyAim: plan.dailyAim,
            dailyIngredientIds: plan.dailyIngredientIds,
          });
          lastSaved.current = ser;
          try {
            window.localStorage.setItem(storageKey, ser);
          } catch {
            // ignore write errors
          }
        },
      );
      saveTimer.current = null;
    }, 500);
  }, [
    blocks,
    dailyAim,
    dailyIngredientIds,
    date,
    editable,
    live,
    storageKey,
    review,
    userId,
  ]);

  useEffect(() => {
    if (!editable || review) return;
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        const payload: PlanBlockInput[] = blocksRef.current.map((b) => ({
          id: b.id,
          start: b.start,
          end: b.end,
          title: b.title,
          description: b.description,
          color: b.color,
          colorPreset: b.colorPreset,
          ingredientIds: b.ingredientIds,
        }));
        const presetsSnapshot = getUserColorPresets(userId);
        void savePlanAction(
          date,
          payload,
          dailyAimRef.current,
          dailyIngredientIdsRef.current,
          presetsSnapshot,
        ).then((plan) => {
          const ser = JSON.stringify({
            blocks: plan.blocks,
            dailyAim: plan.dailyAim,
            dailyIngredientIds: plan.dailyIngredientIds,
          });
          lastSaved.current = ser;
          try {
            window.localStorage.setItem(storageKey, ser);
          } catch {
            // ignore write errors
          }
        });
      }
    };
  }, [date, editable, storageKey, review, userId]);

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
            className="sticky top-0 z-10 flex flex-wrap items-end gap-2 bg-gray-100 p-2 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {!review &&
              (editable ? (
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
              ))}
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
            <Button
              id={`p1an-daily-aim-${userId}`}
              variant="outline"
              className={cn(
                'border-2 px-3 py-2',
                hasDailyAim
                  ? 'border-green-500 text-green-600 bg-green-50 hover:bg-green-100'
                  : 'border-red-500 text-red-600 bg-red-50 hover:bg-red-100',
              )}
              onClick={() => setShowDailyAim(true)}
            >
              {review ? 'Review daily aim' : 'Daily Aim'}
            </Button>
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
                        ...(prev[selected.id] || {
                          good: '',
                          bad: '',
                          ingredients: {},
                        }),
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
                        ...(prev[selected.id] || {
                          good: '',
                          bad: '',
                          ingredients: {},
                        }),
                        bad: e.target.value,
                      },
                    }))
                  }
                />
                {Object.entries(reviews[selected.id]?.ingredients ?? {}).map(
                  ([iidStr, text]) => {
                    const iid = Number(iidStr);
                    const ing = initialIngredients.find((i) => i.id === iid);
                    const src = ing?.icon ? iconSrc(ing.icon) : null;
                    const link =
                      ing &&
                      (viewId
                        ? `/view/${viewId}/ingredient/${ing.id}`
                        : `/ingredient/${ing.id}`);
                    return (
                      <div key={iid} className="mb-2">
                        <div className="mb-1 flex items-center justify-between">
                          {link ? (
                            <Link
                              href={link}
                              className="flex items-center gap-1"
                            >
                              {src ? (
                                <img src={src} alt="" className="h-4 w-4" />
                              ) : (
                                <span>{ing?.icon ?? '❓'}</span>
                              )}
                              <span className="text-sm">
                                {ing?.title ?? 'Secret 🔒'}
                              </span>
                            </Link>
                          ) : (
                            <span className="flex items-center gap-1">
                              {src ? (
                                <img src={src} alt="" className="h-4 w-4" />
                              ) : (
                                <span>{ing?.icon ?? '❓'}</span>
                              )}
                              <span className="text-sm">
                                {ing?.title ?? 'Secret 🔒'}
                              </span>
                            </span>
                          )}
                          {editable && (
                            <button
                              className="text-sm"
                              onClick={() =>
                                removeIngredientReview(selected.id, iid)
                              }
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <textarea
                          className="w-full border p-1"
                          value={text}
                          disabled={!editable}
                          maxLength={1000}
                          rows={3}
                          onChange={(e) =>
                            setReviews((prev) => ({
                              ...prev,
                              [selected.id]: {
                                ...(prev[selected.id] || {
                                  good: '',
                                  bad: '',
                                  ingredients: {},
                                }),
                                ingredients: {
                                  ...(prev[selected.id]?.ingredients || {}),
                                  [iid]: e.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                    );
                  },
                )}
                <label className="block text-sm font-medium">Ingredients</label>
                <div
                  id={`p1an-meta-igrd-${selected.id}-${userId}`}
                  className="mb-2 flex flex-wrap gap-2"
                >
                  {unreviewedIngredientIds.length === 0 && (
                    <span
                      id={`p1an-meta-igrd-none-${selected.id}-${userId}`}
                      className="text-sm text-gray-500"
                    >
                      No ingredient found
                    </span>
                  )}
                  {unreviewedIngredientIds.map((iid) => {
                    const ing = initialIngredients.find((i) => i.id === iid);
                    const src = ing?.icon ? iconSrc(ing.icon) : null;
                    const selectable = selectIngredient && editable;
                    const content = (
                      <>
                        {src ? (
                          <img src={src} alt="" className="h-4 w-4" />
                        ) : (
                          <span>{ing?.icon ?? '❓'}</span>
                        )}
                        <span className="text-sm">
                          {ing?.title ?? 'Secret 🔒'}
                        </span>
                      </>
                    );
                    const link =
                      ing &&
                      !selectable &&
                      (viewId
                        ? `/view/${viewId}/ingredient/${ing.id}`
                        : `/ingredient/${ing.id}`);
                    const cls = cn(
                      'flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow',
                      selectable ? 'cursor-pointer hover:bg-gray-200' : '',
                    );
                    if (link) {
                      return (
                        <Link key={iid} href={link} className={cls}>
                          {content}
                        </Link>
                      );
                    }
                    return (
                      <div
                        key={iid}
                        className={cls}
                        onClick={() => {
                          if (selectable) {
                            addIngredientReview(selected.id, iid);
                            setSelectIngredient(false);
                          }
                        }}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
                {editable && unreviewedIngredientIds.length > 0 && (
                  <Button
                    id={`p1an-meta-igrd-review-${selected.id}-${userId}`}
                    variant="outline"
                    size="sm"
                    className="mb-2"
                    onClick={() => setSelectIngredient((s) => !s)}
                  >
                    {selectIngredient
                      ? 'Cancel ingredient feedback'
                      : 'Write feedback on ingredient'}
                  </Button>
                )}
                {selectIngredient && (
                  <div className="mb-2 text-sm text-gray-500">
                    Select an ingredient above
                  </div>
                )}
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
                        editable &&
                        updateBlock(selected.id, { color: c, colorPreset: '' })
                      }
                      disabled={!editable}
                    />
                  ))}
                </div>
                {selected.colorPreset && (
                  <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
                    <span>Preset: {selected.colorPreset}</span>
                    {editable && (
                      <button
                        aria-label="Remove preset"
                        className="rounded px-1 hover:bg-gray-200"
                        onClick={() =>
                          updateBlock(selected.id, { colorPreset: '' })
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                {(editable || viewerId) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-2"
                      id={`p1an-meta-col-pre-${selected.id}-${userId}`}
                      onClick={() => setShowPresetPicker((s) => !s)}
                    >
                      Presets
                    </Button>
                    {showPresetPicker && (
                      <ColorPresetPicker
                        userId={currentUserId}
                        foreignPresets={
                          currentUserId !== userId ? foreignPresets : undefined
                        }
                        initialCustom={
                          !editable && currentUserId === userId
                            ? initialPlan?.colorPresets
                            : undefined
                        }
                        onSelect={({ id, name, color }) => {
                          if (editable) {
                            updateBlock(selected.id, {
                              color,
                              colorPreset: name,
                            });
                          } else {
                            if (window.confirm('Copy to own presets?')) {
                              addUserColorPreset(currentUserId, {
                                id,
                                name,
                                colors: [color],
                              });
                            }
                          }
                          setShowPresetPicker(false);
                        }}
                        onClose={() => setShowPresetPicker(false)}
                      />
                    )}
                  </>
                )}
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
                    {(selected.ingredientIds ?? []).length === 0 && (
                      <span
                        id={`p1an-meta-igrd-none-${selected.id}-${userId}`}
                        className="text-sm text-gray-500"
                      >
                        No ingredient found
                      </span>
                    )}
                    {(selected.ingredientIds ?? []).map((iid) => {
                      const ing = initialIngredients.find((i) => i.id === iid);
                      const src = ing?.icon ? iconSrc(ing.icon) : null;
                      const content = (
                        <>
                          {src ? (
                            <img src={src} alt="" className="h-4 w-4" />
                          ) : (
                            <span>{ing?.icon ?? '❓'}</span>
                          )}
                          <span className="text-sm">
                            {ing?.title ?? 'Secret 🔒'}
                          </span>
                          {editable && ing && (
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
                        </>
                      );
                      const link =
                        ing &&
                        (viewId
                          ? `/view/${viewId}/ingredient/${ing.id}`
                          : `/ingredient/${ing.id}`);
                      return link ? (
                        <Link
                          key={iid}
                          href={link}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow"
                        >
                          {content}
                        </Link>
                      ) : (
                        <span
                          key={iid}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow"
                        >
                          {content}
                        </span>
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
      {showDailyAim && (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDailyAim(false);
          }}
        >
          <div className="relative w-[90vw] max-h-[90vh] overflow-y-auto sm:w-[50vw] sm:max-w-xl rounded bg-white p-10 sm:p-20 shadow-lg">
            <button
              id={`p1an-day-x-${userId}`}
              className="absolute left-4 top-4 text-gray-500"
              onClick={() => setShowDailyAim(false)}
            >
              X
            </button>
            {review ? (
              <>
                <h2 className="mb-4 text-lg font-semibold text-center">
                  Review daily aim
                </h2>
                <div className="flex flex-col gap-6 md:flex-row">
                  <div className="md:w-1/2 max-h-[60vh]">
                    <span className="mb-2 block text-sm font-medium">
                      Daily aim
                    </span>
                    {dailyAim ? (
                      <pre className="max-h-[60vh] w-full overflow-y-auto whitespace-pre-wrap rounded border p-6">
                        {dailyAim}
                      </pre>
                    ) : (
                      <div className="max-h-[60vh] w-full overflow-y-auto rounded border p-6">
                        <span className="text-sm text-gray-500">
                          No daily aim set
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex max-h-[60vh] flex-col overflow-y-auto md:w-1/2">
                    <label
                      className="block text-sm font-medium"
                      htmlFor={`p1an-day-feedback-${userId}`}
                    >
                      How did your day go?
                    </label>
                    <textarea
                      id={`p1an-day-feedback-${userId}`}
                      className="mb-4 h-40 w-full border p-4"
                      value={reviews['day']?.good ?? ''}
                      disabled={!editable}
                      maxLength={1000}
                      onChange={(e) =>
                        setReviews((prev) => ({
                          ...prev,
                          day: {
                            ...(prev.day || {
                              good: '',
                              bad: '',
                              ingredients: {},
                            }),
                            good: e.target.value,
                          },
                        }))
                      }
                    />
                    <div className="mb-2 pl-4">
                      <span className="block text-sm font-medium">
                        Daily ingredients
                      </span>
                      <div
                        id={`p1an-day-igrd-${userId}`}
                        className="mb-2 flex flex-wrap gap-2"
                      >
                        {dailyIngredientIds.length === 0 && (
                          <span
                            id={`p1an-day-igrd-none-${userId}`}
                            className="text-sm text-gray-500"
                          >
                            No ingredient found
                          </span>
                        )}
                        {dailyIngredientIds.map((iid) => {
                          const ing = initialIngredients.find(
                            (i) => i.id === iid,
                          );
                          const src = ing?.icon ? iconSrc(ing.icon) : null;
                          const selectable = selectDailyIngredient && editable;
                          const content = (
                            <>
                              {src ? (
                                <img src={src} alt="" className="h-4 w-4" />
                              ) : (
                                <span>{ing?.icon ?? '❓'}</span>
                              )}
                              <span className="text-sm">
                                {ing?.title ?? 'Secret 🔒'}
                              </span>
                            </>
                          );
                          const link =
                            ing &&
                            !selectable &&
                            (viewId
                              ? `/view/${viewId}/ingredient/${ing.id}`
                              : `/ingredient/${ing.id}`);
                          const cls = cn(
                            'flex items-center gap-1 rounded border px-2 py-1',
                            selectable
                              ? 'cursor-pointer bg-gray-100 hover:bg-gray-200'
                              : '',
                          );
                          if (link) {
                            return (
                              <Link key={iid} href={link} className={cls}>
                                {content}
                              </Link>
                            );
                          }
                          return (
                            <div
                              key={iid}
                              className={cls}
                              onClick={() => {
                                if (selectable) {
                                  addIngredientReview('day', iid);
                                  setSelectDailyIngredient(false);
                                }
                              }}
                            >
                              {content}
                            </div>
                          );
                        })}
                      </div>
                      {Object.entries(reviews['day']?.ingredients ?? {}).map(
                        ([iidStr, text]) => {
                          const iid = Number(iidStr);
                          const ing = initialIngredients.find(
                            (i) => i.id === iid,
                          );
                          const src = ing?.icon ? iconSrc(ing.icon) : null;
                          const link =
                            ing &&
                            (viewId
                              ? `/view/${viewId}/ingredient/${ing.id}`
                              : `/ingredient/${ing.id}`);
                          return (
                            <div key={iid} className="mb-2">
                              <div className="mb-1 flex items-center justify-between">
                                {link ? (
                                  <Link
                                    href={link}
                                    className="flex items-center gap-1"
                                  >
                                    {src ? (
                                      <img
                                        src={src}
                                        alt=""
                                        className="h-4 w-4"
                                      />
                                    ) : (
                                      <span>{ing?.icon ?? '❓'}</span>
                                    )}
                                    <span className="text-sm">
                                      {ing?.title ?? 'Secret 🔒'}
                                    </span>
                                  </Link>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    {src ? (
                                      <img
                                        src={src}
                                        alt=""
                                        className="h-4 w-4"
                                      />
                                    ) : (
                                      <span>{ing?.icon ?? '❓'}</span>
                                    )}
                                    <span className="text-sm">
                                      {ing?.title ?? 'Secret 🔒'}
                                    </span>
                                  </span>
                                )}
                                {editable && (
                                  <button
                                    className="text-sm"
                                    onClick={() =>
                                      removeIngredientReview('day', iid)
                                    }
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              <textarea
                                className="w-full border p-1"
                                value={text}
                                disabled={!editable}
                                maxLength={1000}
                                rows={3}
                                onChange={(e) =>
                                  setReviews((prev) => ({
                                    ...prev,
                                    day: {
                                      ...(prev.day || {
                                        good: '',
                                        bad: '',
                                        ingredients: {},
                                      }),
                                      ingredients: {
                                        ...(prev.day?.ingredients || {}),
                                        [iid]: e.target.value,
                                      },
                                    },
                                  }))
                                }
                              />
                            </div>
                          );
                        },
                      )}
                      {editable && unreviewedDailyIngredientIds.length > 0 && (
                        <Button
                          id={`p1an-day-igrd-review-${userId}`}
                          variant="outline"
                          size="sm"
                          className="mb-2"
                          onClick={() => setSelectDailyIngredient((s) => !s)}
                        >
                          {selectDailyIngredient
                            ? 'Cancel ingredient feedback'
                            : 'Write feedback on ingredient'}
                        </Button>
                      )}
                      {selectDailyIngredient && (
                        <div className="mb-2 text-sm text-gray-500">
                          Select an ingredient above
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <Button
                    variant="outline"
                    id={`p1an-day-done-${userId}`}
                    onClick={() => setShowDailyAim(false)}
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-semibold text-center">
                  Daily Aim
                </h2>
                <textarea
                  id={`p1an-day-aim-${userId}`}
                  className="mb-8 w-full resize-y border p-6"
                  value={dailyAim}
                  onChange={(e) => setDailyAim(e.target.value)}
                  rows={16}
                  maxLength={500}
                  disabled={!editable}
                />
                <div className="mb-2 pl-4">
                  <span className="block text-sm font-medium">
                    Daily ingredients
                  </span>
                  <div
                    id={`p1an-day-igrd-${userId}`}
                    className="mb-2 flex flex-wrap gap-2"
                  >
                    {dailyIngredientIds.length === 0 && (
                      <span
                        id={`p1an-day-igrd-none-${userId}`}
                        className="text-sm text-gray-500"
                      >
                        No ingredient found
                      </span>
                    )}
                    {dailyIngredientIds.map((iid) => {
                      const ing = initialIngredients.find((i) => i.id === iid);
                      const src = ing?.icon ? iconSrc(ing.icon) : null;
                      const content = (
                        <>
                          {src ? (
                            <img src={src} alt="" className="h-4 w-4" />
                          ) : (
                            <span>{ing?.icon ?? '❓'}</span>
                          )}
                          <span className="text-sm">
                            {ing?.title ?? 'Secret 🔒'}
                          </span>
                          {editable && ing && (
                            <button
                              type="button"
                              className="ml-1 text-xs text-red-500"
                              onClick={() => removeDailyIngredient(iid)}
                            >
                              X
                            </button>
                          )}
                        </>
                      );
                      const link =
                        ing &&
                        (viewId
                          ? `/view/${viewId}/ingredient/${ing.id}`
                          : `/ingredient/${ing.id}`);
                      return link ? (
                        <Link
                          key={iid}
                          id={`p1an-day-igrd-${iid}-${userId}`}
                          href={link}
                          className="flex items-center gap-1 rounded border px-2 py-1"
                        >
                          {content}
                        </Link>
                      ) : (
                        <span
                          key={iid}
                          className="flex items-center gap-1 rounded border px-2 py-1"
                        >
                          {content}
                        </span>
                      );
                    })}
                  </div>
                  {editable && (
                    <Link
                      id={`p1an-day-add-${userId}`}
                      href={`/ingredientsforplanning?date=${date}&block=day&mode=${mode}`}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      Add ingredients +
                    </Link>
                  )}
                </div>
                <div className="mt-2 text-right">
                  <Button
                    variant="outline"
                    id={`p1an-day-done-${userId}`}
                    onClick={() => setShowDailyAim(false)}
                  >
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
