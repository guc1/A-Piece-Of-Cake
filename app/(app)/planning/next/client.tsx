'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useViewContext } from '@/lib/view-context';
import type { Plan, PlanBlock, PlanBlockInput } from '@/types/plan';
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

// shrink timeline so 24h fits on one screen
const BASE_PIXELS_PER_MINUTE = 0.5;
const TIMELINE_HEIGHT = 24 * 60 * BASE_PIXELS_PER_MINUTE; // full-day height
const MAX_MINUTES = 24 * 60; // minutes in a day
const DEFAULT_START = 5 * 60; // 05:00
const DEFAULT_END = 22 * 60; // 22:00
const Z_BASE = 10000;

interface Props {
  userId: string;
  date: string; // YYYY-MM-DD
  initialPlan: Plan | null;
}

export default function EditorClient({ userId, date, initialPlan }: Props) {
  const { editable } = useViewContext();
  const [blocks, setBlocks] = useState<PlanBlock[]>(initialPlan?.blocks ?? []);
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

  function updateBlock(id: string, updates: Partial<PlanBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
  }

  function addBlock() {
    if (!editable) return;
    const sorted = [...blocks].sort(
      (a, b) => minutesFromIso(a.start) - minutesFromIso(b.start),
    );
    let start = 0;
    if (sorted.length) {
      const last = sorted.reduce((p, c) =>
        minutesFromIso(c.end) > minutesFromIso(p.end) ? c : p,
      );
      start = minutesFromIso(last.end);
    }
    const duration = 60;
    let candidate = start;
    function isFree(s: number, e: number) {
      return !sorted.some(
        (b) =>
          Math.max(s, minutesFromIso(b.start)) <
          Math.min(e, minutesFromIso(b.end)),
      );
    }
    let placed = false;
    while (candidate + duration <= MAX_MINUTES) {
      if (isFree(candidate, candidate + duration)) {
        placed = true;
        break;
      }
      candidate += 15;
    }
    if (!placed) {
      candidate = 0;
      while (candidate + duration <= MAX_MINUTES) {
        if (isFree(candidate, candidate + duration)) {
          placed = true;
          break;
        }
        candidate += 15;
      }
    }
    if (!placed) {
      alert('No 1-hour slot available.');
      return;
    }
    const id = crypto.randomUUID();
    const newBlock: PlanBlock = {
      id,
      planId: initialPlan?.id || '',
      start: isoFromMinutes(candidate),
      end: isoFromMinutes(candidate + duration),
      title: '',
      description: '',
      color: COLORS[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBlocks((b) => [...b, newBlock]);
    setSelectedId(id);
  }

  const lastSaved = useRef(JSON.stringify(initialPlan?.blocks ?? []));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    if (!editable) return;
    const serialized = JSON.stringify(blocks);
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
      }));
      savePlanAction(date, payload).then((plan) => {
        setBlocks(plan.blocks);
        lastSaved.current = JSON.stringify(plan.blocks);
      });
      saveTimer.current = null;
    }, 500);
  }, [blocks, date, editable]);

  useEffect(() => {
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
        }));
        void savePlanAction(date, payload).then((plan) => {
          lastSaved.current = JSON.stringify(plan.blocks);
        });
      }
    };
  }, [date]);

  function handleTimeChange(id: string, field: 'start' | 'end', value: string) {
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
    if (!editable) return;
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

  return (
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
          {editable ? (
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
              return (
                <span
                  key={h}
                  className="absolute right-1 -translate-y-1/2 text-[10px] text-gray-500"
                  style={{
                    top: (h * 60 - startMinute) * PIXELS_PER_MINUTE,
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
                    style={{ top: (h * 60 - startMinute) * PIXELS_PER_MINUTE }}
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
                    cursor: editable ? 'move' : 'default',
                  }}
                  onPointerMove={(e) => {
                    if (!editable) return;
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
                    if (!editable) return;
                    (e.currentTarget as HTMLElement).style.cursor = 'move';
                  }}
                  onPointerDown={(e) => {
                    if (!editable) return;
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
                    setSelectedId(b.id);
                  }}
                >
                  <span className="pointer-events-none block truncate">
                    {b.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {editable ? (
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
        )}
      </div>
      {selected ? (
        <div
          className="w-1/2 border-l p-4"
          id={`p1an-meta-${selected.id}-${userId}`}
        >
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
        </div>
      ) : null}
    </div>
  );
}
