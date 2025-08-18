'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { hrefFor } from '@/lib/navigation';
import { saveNextDayPlan } from './actions';
import type { PlanBlock } from '@/types/plan';

const COLORS = [
  '#f87171',
  '#f97316',
  '#4ade80',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
  '#94a3b8',
  '#facc15',
  '#ec4899',
  '#14b8a6',
];

const PX_PER_MIN = 2;
const SNAP = 15; // minutes

interface BlockState {
  id: string;
  start: Date;
  end: Date;
  title: string;
  description: string;
  color: string;
  isNew?: boolean;
}

function minutesOf(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function dateFromMinutes(base: Date, mins: number) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(mins);
  return d;
}

export default function PlanningEditor({
  userId,
  initialBlocks,
  date,
}: {
  userId: string;
  initialBlocks: PlanBlock[];
  date: string;
}) {
  const router = useRouter();
  const ctx = useViewContext();
  const { editable } = ctx;
  const dayStart = new Date(`${date}T00:00:00`);
  const [blocks, setBlocks] = useState<BlockState[]>(
    initialBlocks.map((b) => ({
      id: b.id,
      start: new Date(b.start),
      end: new Date(b.end),
      title: b.title,
      description: b.description,
      color: b.color || COLORS[3],
    })),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, BlockState>>({});

  const sorted = [...blocks].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  useEffect(() => {
    if (selected) {
      const blk = blocks.find((b) => b.id === selected);
      if (blk) setSnapshots((s) => ({ ...s, [selected]: { ...blk } }));
    }
  }, [selected, blocks]);

  function addBlock() {
    if (!editable) return;
    const duration = 60;
    const taken: boolean[] = Array(24 * 60).fill(false);
    blocks.forEach((b) => {
      const s = minutesOf(b.start);
      const e = minutesOf(b.end);
      for (let i = s; i < e; i++) taken[i] = true;
    });
    let startMin = 0;
    for (let t = 0; t <= 24 * 60 - duration; t += SNAP) {
      let free = true;
      for (let i = t; i < t + duration; i++) {
        if (taken[i]) {
          free = false;
          break;
        }
      }
      if (free) {
        startMin = t;
        break;
      }
    }
    if (startMin + duration > 24 * 60) {
      alert('No 1-hour slot available.');
      return;
    }
    const id = `tmp-${crypto.randomUUID()}`;
    const blk: BlockState = {
      id,
      start: dateFromMinutes(dayStart, startMin),
      end: dateFromMinutes(dayStart, startMin + duration),
      title: '',
      description: '',
      color: COLORS[3],
      isNew: true,
    };
    setBlocks((b) => [...b, blk]);
    setSelected(id);
  }

  function updateBlock(id: string, partial: Partial<BlockState>) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...partial } : b)));
  }

  function handleDrag(id: string, deltaMin: number) {
    setBlocks((bs) =>
      bs.map((b) => {
        if (b.id !== id) return b;
        const dur = minutesOf(b.end) - minutesOf(b.start);
        let newStart = minutesOf(b.start) + deltaMin;
        newStart = Math.max(0, Math.min(24 * 60 - dur, newStart));
        const s = dateFromMinutes(dayStart, newStart);
        const e = dateFromMinutes(dayStart, newStart + dur);
        return { ...b, start: s, end: e };
      }),
    );
  }

  function handleResize(id: string, deltaStart: number, deltaEnd: number) {
    setBlocks((bs) =>
      bs.map((b) => {
        if (b.id !== id) return b;
        let sMin = minutesOf(b.start) + deltaStart;
        let eMin = minutesOf(b.end) + deltaEnd;
        if (eMin - sMin < SNAP) {
          if (deltaStart !== 0) sMin = eMin - SNAP;
          else eMin = sMin + SNAP;
        }
        sMin = Math.max(0, sMin);
        eMin = Math.min(24 * 60, eMin);
        const s = dateFromMinutes(dayStart, sMin);
        const e = dateFromMinutes(dayStart, eMin);
        return { ...b, start: s, end: e };
      }),
    );
  }

  function startDrag(e: React.MouseEvent, id: string) {
    if (!editable) return;
    e.preventDefault();
    const startY = e.clientY;
    const startMin = minutesOf(blocks.find((b) => b.id === id)!.start);
    function onMove(ev: MouseEvent) {
      const dy = ev.clientY - startY;
      const deltaMin = Math.round(dy / (PX_PER_MIN * SNAP)) * SNAP;
      handleDrag(id, deltaMin);
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function startResize(
    e: React.MouseEvent,
    id: string,
    edge: 'top' | 'bottom',
  ) {
    if (!editable) return;
    e.preventDefault();
    const startY = e.clientY;
    function onMove(ev: MouseEvent) {
      const dy = ev.clientY - startY;
      const deltaMin = Math.round(dy / (PX_PER_MIN * SNAP)) * SNAP;
      if (edge === 'top') handleResize(id, deltaMin, 0);
      else handleResize(id, 0, deltaMin);
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  async function save() {
    if (!editable) return;
    const payload = blocks.map((b) => ({
      id: b.isNew ? undefined : b.id,
      start: b.start.toISOString(),
      end: b.end.toISOString(),
      title: b.title,
      description: b.description,
      color: b.color,
    }));
    await saveNextDayPlan(payload);
    alert('Saved');
    router.push(hrefFor('/planning', ctx));
  }

  function closePanel() {
    if (!selected) return;
    const snap = snapshots[selected];
    if (snap && blocks.find((b) => b.id === selected)?.isNew) {
      setBlocks((bs) => bs.filter((b) => b.id !== selected));
    } else if (snap) {
      setBlocks((bs) => bs.map((b) => (b.id === selected ? snap : b)));
    }
    setSelected(null);
  }

  const selectedBlock = blocks.find((b) => b.id === selected);

  return (
    <div className="flex h-screen">
      <div
        className="relative w-1/2 border-r"
        id={`p1an-timecol-${userId}`}
        onClick={() => setSelected(null)}
      >
        <div className="sticky top-0 z-10 flex justify-end bg-white p-2">
          <button
            id={`p1an-add-top-${userId}`}
            disabled={!editable}
            title={!editable ? 'Read-only in viewing mode' : ''}
            onClick={addBlock}
            className="rounded border px-2 py-1 disabled:opacity-50"
          >
            + Add timeslot
          </button>
        </div>
        <div className="relative" style={{ height: PX_PER_MIN * 60 * 24 }}>
          {Array.from({ length: 24 }).map((_, h) => (
            <div
              key={h}
              id={`p1an-hour-${h}-${userId}`}
              className="absolute w-full border-t border-gray-200 text-xs text-gray-500"
              style={{ top: h * 60 * PX_PER_MIN }}
            >
              <span className="-mt-2 block w-12">
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}
          {sorted.map((b, idx) => {
            const top = minutesOf(b.start) * PX_PER_MIN;
            const height = (minutesOf(b.end) - minutesOf(b.start)) * PX_PER_MIN;
            return (
              <div
                key={b.id}
                id={`p1an-blk-${b.id}-${userId}`}
                data-selected={selected === b.id ? 'true' : undefined}
                className="absolute left-1 right-1 cursor-pointer rounded text-sm text-white"
                style={{
                  top,
                  height,
                  backgroundColor: b.color,
                  zIndex: sorted.length - idx,
                }}
                onMouseDown={(e) => startDrag(e, b.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(b.id);
                }}
              >
                <div
                  className="absolute left-0 right-0 top-0 h-2 cursor-n-resize"
                  onMouseDown={(e) => startResize(e, b.id, 'top')}
                />
                <div className="h-full w-full overflow-hidden p-1">
                  {b.title}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize"
                  onMouseDown={(e) => startResize(e, b.id, 'bottom')}
                />
              </div>
            );
          })}
          <button
            id={`p1an-add-fab-${userId}`}
            disabled={!editable}
            title={!editable ? 'Read-only in viewing mode' : ''}
            onClick={addBlock}
            className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-orange-500 text-white disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
      <div className="relative w-1/2 p-4">
        {selectedBlock && (
          <div
            id={`p1an-meta-${selectedBlock.id}-${userId}`}
            className="space-y-4"
          >
            {!editable && (
              <div className="text-xs text-gray-500">
                Read-only (viewing mode)
              </div>
            )}
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor={`p1an-meta-ttl-${selectedBlock.id}-${userId}`}
              >
                Activity
              </label>
              <input
                id={`p1an-meta-ttl-${selectedBlock.id}-${userId}`}
                type="text"
                maxLength={60}
                value={selectedBlock.title}
                onChange={(e) =>
                  updateBlock(selectedBlock.id, { title: e.target.value })
                }
                disabled={!editable}
                className="w-full rounded border p-1"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor={`p1an-meta-dsc-${selectedBlock.id}-${userId}`}
              >
                Description
              </label>
              <textarea
                id={`p1an-meta-dsc-${selectedBlock.id}-${userId}`}
                maxLength={500}
                value={selectedBlock.description}
                onChange={(e) =>
                  updateBlock(selectedBlock.id, { description: e.target.value })
                }
                disabled={!editable}
                className="w-full rounded border p-1"
                rows={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Color</label>
              <div
                id={`p1an-meta-col-${selectedBlock.id}-${userId}`}
                className="flex flex-wrap gap-2"
              >
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={!editable}
                    onClick={() => updateBlock(selectedBlock.id, { color: c })}
                    className={`h-6 w-6 rounded-full border ${selectedBlock.color === c ? 'ring-2 ring-black' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Time</label>
              <div
                className="flex gap-2"
                id={`p1an-meta-col-${selectedBlock.id}-${userId}`}
              >
                <input
                  id={`p1an-meta-tms-${selectedBlock.id}-${userId}`}
                  type="time"
                  step={900}
                  value={selectedBlock.start.toISOString().slice(11, 16)}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const start = new Date(selectedBlock.start);
                    start.setHours(h, m, 0, 0);
                    if (start >= selectedBlock.end)
                      start.setTime(selectedBlock.end.getTime() - SNAP * 60000);
                    updateBlock(selectedBlock.id, { start });
                  }}
                  disabled={!editable}
                  className="rounded border p-1"
                />
                <span>→</span>
                <input
                  id={`p1an-meta-tme-${selectedBlock.id}-${userId}`}
                  type="time"
                  step={900}
                  value={selectedBlock.end.toISOString().slice(11, 16)}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const end = new Date(selectedBlock.end);
                    end.setHours(h, m, 0, 0);
                    if (end <= selectedBlock.start)
                      end.setTime(selectedBlock.start.getTime() + SNAP * 60000);
                    updateBlock(selectedBlock.id, { end });
                  }}
                  disabled={!editable}
                  className="rounded border p-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                id={`p1an-meta-close-${userId}`}
                type="button"
                onClick={closePanel}
                className="rounded border px-3 py-1"
              >
                X
              </button>
              <button
                id={`p1an-meta-save-${userId}`}
                type="button"
                onClick={save}
                disabled={!editable}
                className="rounded bg-orange-500 px-3 py-1 text-white disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
