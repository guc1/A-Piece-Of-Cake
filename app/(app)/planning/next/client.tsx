'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
const PIXELS_PER_MINUTE = 0.5;
const MAX_MINUTES = 24 * 60 - 1; // 23:59 in minutes

interface Props {
  userId: string;
  date: string; // YYYY-MM-DD
  initialPlan: Plan | null;
}

export default function EditorClient({ userId, date, initialPlan }: Props) {
  const { editable } = useViewContext();
  const router = useRouter();
  const [blocks, setBlocks] = useState<PlanBlock[]>(initialPlan?.blocks ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => blocks.find((b) => b.id === selectedId) || null,
    [blocks, selectedId],
  );
  const draggingRef = useRef(false);

  const minutesFromIso = useCallback(
    (iso: string) => {
      const base = new Date(`${date}T00:00:00`);
      const diff = Math.round((new Date(iso).getTime() - base.getTime()) / 60000);
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

  function onSave() {
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
      setSelectedId(null);
    });
  }

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
    function onMove(ev: PointerEvent) {
      dragRef.current = true;
      const delta =
        Math.round((ev.clientY - startY) / PIXELS_PER_MINUTE / 15) * 15;
      const rawStart = initStart + delta;
      const rawEnd = initEnd + delta;
      const threshold = 60;
      if (mode === 'move') {
        if (rawStart < -threshold) {
          const prev = new Date(date);
          prev.setDate(prev.getDate() - 1);
          router.push(`/planning/next?date=${prev.toISOString().slice(0, 10)}`);
          return;
        }
        if (rawEnd > MAX_MINUTES + threshold) {
          const next = new Date(date);
          next.setDate(next.getDate() + 1);
          router.push(`/planning/next?date=${next.toISOString().slice(0, 10)}`);
          return;
        }
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

  return (
    <div className="flex h-full">
      <div
        className={`relative overflow-y-hidden ${selected ? 'w-1/2' : 'w-full'}`}
        id={`p1an-timecol-${userId}`}
        onPointerDown={() => setSelectedId(null)}
      >
        {editable ? (
          <button
            id={`p1an-add-top-${userId}`}
            onClick={(e) => {
              e.stopPropagation();
              addBlock();
            }}
            className="sticky top-0 z-10 w-full bg-gray-100 py-2 text-sm"
            disabled={!editable}
          >
            + Add timeslot
          </button>
        ) : (
          <button
            id={`p1an-add-top-${userId}`}
            className="sticky top-0 z-10 w-full bg-gray-100 py-2 text-sm"
            disabled
            title="Read-only in viewing mode"
          >
            + Add timeslot
          </button>
        )}
        <div
          style={{ height: 24 * 60 * PIXELS_PER_MINUTE }}
          className="relative"
        >
          <div className="absolute left-0 top-0 w-12">
            {Array.from({ length: 25 }).map((_, h) => (
              <span
                key={h}
                className="absolute right-1 -translate-y-1/2 text-[10px] text-gray-500"
                style={{ top: h * 60 * PIXELS_PER_MINUTE }}
              >
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>
          <div className="absolute left-12 right-0 top-0">
            {Array.from({ length: 25 }).map((_, h) => (
              <div key={h}>
                <div
                  id={`p1an-hour-${h}-${userId}`}
                  className="absolute left-0 right-0 border-t border-gray-300"
                  style={{ top: h * 60 * PIXELS_PER_MINUTE }}
                />
                {h < 24 &&
                  [15, 30, 45].map((m) => (
                    <div
                      key={m}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{ top: (h * 60 + m) * PIXELS_PER_MINUTE }}
                    />
                  ))}
              </div>
            ))}
            {sortedBlocks.map((b) => {
              const top = minutesFromIso(b.start) * PIXELS_PER_MINUTE;
              const height =
                (minutesFromIso(b.end) - minutesFromIso(b.start)) *
                PIXELS_PER_MINUTE;
              const z = 10000 - minutesFromIso(b.start);
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
              <Button id={`p1an-meta-save-${userId}`} onClick={onSave}>
                Save
              </Button>
            ) : (
              <Button
                id={`p1an-meta-save-${userId}`}
                disabled
                title="Read-only in viewing mode"
              >
                Save
              </Button>
            )}
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
