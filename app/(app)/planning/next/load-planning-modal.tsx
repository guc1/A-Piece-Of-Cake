'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/plan';
import type { Ingredient } from '@/types/ingredient';
import type { Flavor } from '@/types/flavor';
import type { Subflavor } from '@/types/subflavor';

interface PreviewMeta {
  fromSnapshot: boolean;
  snapshotCapturedAt: string | null;
}

interface LoadPlanningModalProps {
  open: boolean;
  onClose: () => void;
  step: 'calendar' | 'preview';
  selectedDate: string | null;
  onDateChange: (date: string) => void;
  onPreview: (date: string) => void;
  onSelect: (date: string) => void;
  onAddNow: (date: string) => void;
  onBack: () => void;
  loadingAction: 'preview' | 'select' | 'add' | null;
  error: string | null;
  snapshotDates: string[];
  previewPlan: Plan | null;
  previewMeta: PreviewMeta | null;
  tz: string;
  ingredientMap: Map<number, Ingredient>;
  flavorMap: Map<string, Flavor>;
  subflavorMap: Map<string, Subflavor>;
  currentPlanDate: string;
  planningDateLabel: string;
}

function formatDateLabel(date: string, tz: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString([], {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toMonth(date?: string) {
  const base = date ? new Date(`${date}T00:00:00`) : new Date();
  base.setDate(1);
  return base;
}

export default function LoadPlanningModal({
  open,
  onClose,
  step,
  selectedDate,
  onDateChange,
  onPreview,
  onSelect,
  onAddNow,
  onBack,
  loadingAction,
  error,
  snapshotDates,
  previewPlan,
  previewMeta,
  tz,
  ingredientMap,
  flavorMap,
  subflavorMap,
  currentPlanDate,
  planningDateLabel,
}: LoadPlanningModalProps) {
  const [month, setMonth] = useState(() => toMonth(selectedDate || undefined));
  const snapshotSet = useMemo(() => new Set(snapshotDates), [snapshotDates]);

  useEffect(() => {
    if (!open) return;
    setMonth(toMonth(selectedDate || undefined));
  }, [open, selectedDate]);

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const start = new Date(monthStart);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(monthEnd);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const monthLabel = month.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!open) return null;

  const isPreviewing = loadingAction === 'preview';
  const isSelecting = loadingAction === 'select';
  const isAdding = loadingAction === 'add';

  const sortedBlocks = previewPlan
    ? [...previewPlan.blocks].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      )
    : [];

  const dailyIngredientNames = previewPlan
    ? (previewPlan.dailyIngredientIds ?? []).map(
        (id) => ingredientMap.get(id)?.title ?? `Ingredient #${id}`,
      )
    : [];

  const previewDateLabel = selectedDate
    ? formatDateLabel(selectedDate, tz)
    : '';

  const snapshotDetail = previewMeta?.snapshotCapturedAt
    ? new Date(previewMeta.snapshotCapturedAt).toLocaleString('en-US', {
        timeZone: tz,
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-orange-500">
              Planning for next day
            </p>
            <h2 className="text-lg font-semibold text-orange-700">
              {planningDateLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-orange-200 px-2 py-1 text-orange-600 hover:bg-orange-100"
            aria-label="Close load planning"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          {step === 'calendar' ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Pick a past date to reuse its planning. Days with captured
                snapshots glow in orange — perfect for quickly loading a tried
                and true schedule.
              </p>
              <div className="rounded-2xl border border-orange-100 bg-white/80 p-4 shadow-inner">
                <div className="mb-3 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-200 text-orange-600"
                    onClick={() =>
                      setMonth((prev) => {
                        const next = new Date(prev);
                        next.setMonth(prev.getMonth() - 1);
                        return next;
                      })
                    }
                  >
                    ❮
                  </Button>
                  <div className="text-sm font-semibold text-orange-600">
                    {monthLabel}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-200 text-orange-600"
                    onClick={() =>
                      setMonth((prev) => {
                        const next = new Date(prev);
                        next.setMonth(prev.getMonth() + 1);
                        return next;
                      })
                    }
                  >
                    ❯
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-zinc-500">
                  {weekDays.map((day) => (
                    <div key={day} className="font-semibold">
                      {day}
                    </div>
                  ))}
                  {days.map((day) => {
                    const iso = day.toLocaleDateString('en-CA');
                    const isSelected = iso === selectedDate;
                    const hasSnapshot = snapshotSet.has(iso);
                    const isCurrentPlan = iso === currentPlanDate;
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <button
                        type="button"
                        key={day.toISOString()}
                        onClick={() => onDateChange(iso)}
                        className={cn(
                          'rounded-lg border px-1 py-2 text-sm transition',
                          hasSnapshot
                            ? 'border-orange-300 bg-orange-50 text-orange-700'
                            : 'border-transparent bg-white',
                          isSelected &&
                            'border-orange-500 bg-orange-500 text-white shadow-md',
                          !hasSnapshot && !isSelected &&
                            'text-zinc-500 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700',
                          isCurrentPlan && !isSelected && 'border-dashed border-orange-400',
                          isToday && !isSelected && 'ring-1 ring-orange-400',
                        )}
                      >
                        <div className="text-base font-semibold">{day.getDate()}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-wide text-orange-500">
                          {hasSnapshot ? 'Snap' : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : null}
              <div className="flex flex-wrap justify-between gap-3">
                <Button variant="outline" onClick={onClose} className="border-zinc-200">
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => selectedDate && onPreview(selectedDate)}
                    disabled={!selectedDate || isPreviewing}
                    className="border-orange-300 text-orange-600"
                  >
                    {isPreviewing ? 'Loading…' : 'Preview'}
                  </Button>
                  <Button
                    onClick={() => selectedDate && onSelect(selectedDate)}
                    disabled={!selectedDate || isSelecting}
                    className="bg-orange-500 text-white shadow hover:bg-orange-600"
                  >
                    {isSelecting ? 'Loading…' : 'Select'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 shadow-inner">
                <p className="text-xs uppercase tracking-wide text-orange-500">
                  Previewing
                </p>
                <h3 className="text-xl font-semibold text-orange-700">
                  {previewDateLabel}
                </h3>
                {previewMeta?.fromSnapshot ? (
                  <p className="text-sm text-orange-600">
                    Showing the historical snapshot
                    {snapshotDetail ? ` captured ${snapshotDetail}` : ''}.
                  </p>
                ) : (
                  <p className="text-sm text-orange-600">
                    No snapshot for this day — previewing the latest saved plan.
                  </p>
                )}
              </div>
              {previewPlan?.dailyAim ? (
                <div className="rounded-xl border border-orange-100 bg-white/90 p-4 shadow">
                  <h4 className="text-sm font-semibold text-orange-700">Daily aim</h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">
                    {previewPlan.dailyAim}
                  </p>
                </div>
              ) : null}
              {dailyIngredientNames.length > 0 ? (
                <div className="rounded-xl border border-orange-100 bg-white/90 p-4 shadow">
                  <h4 className="text-sm font-semibold text-orange-700">
                    Daily ingredients
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                    {dailyIngredientNames.map((name, idx) => (
                      <li key={`${name}-${idx}`}>• {name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow">
                <h4 className="text-sm font-semibold text-orange-700">
                  Schedule blocks
                </h4>
                <div className="mt-3 max-h-[280px] space-y-3 overflow-y-auto pr-1">
                  {sortedBlocks.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      No activities were saved for this day.
                    </p>
                  ) : (
                    sortedBlocks.map((block) => {
                      const ingredientNames = (block.ingredientIds ?? [])
                        .map((id) => ingredientMap.get(id)?.title)
                        .filter(Boolean) as string[];
                      const flavorNames = (block.flavorIds ?? [])
                        .map((id) => flavorMap.get(id)?.name)
                        .filter(Boolean) as string[];
                      const subflavorNames = (block.subflavorIds ?? [])
                        .map((id) => subflavorMap.get(id)?.name)
                        .filter(Boolean) as string[];
                      return (
                        <div
                          key={`${block.id}-${block.start}`}
                          className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-orange-700">
                              {block.title || 'Untitled activity'}
                            </span>
                            <span className="text-xs font-medium text-orange-500">
                              {formatTime(block.start, tz)} – {formatTime(block.end, tz)}
                            </span>
                          </div>
                          {block.description ? (
                            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                              {block.description}
                            </p>
                          ) : null}
                          {flavorNames.length > 0 || subflavorNames.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-orange-600">
                              {[...flavorNames, ...subflavorNames].map((name) => (
                                <span
                                  key={`${block.id}-${name}`}
                                  className="rounded-full bg-white/80 px-2 py-1 shadow"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {ingredientNames.length > 0 ? (
                            <p className="mt-2 text-xs text-orange-500">
                              Ingredients: {ingredientNames.join(', ')}
                            </p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : null}
              <div className="flex flex-wrap justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border-orange-200 text-orange-600"
                  disabled={isAdding}
                >
                  Choose another date
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => selectedDate && onSelect(selectedDate)}
                    disabled={!selectedDate || isSelecting || isAdding}
                    className="border-orange-300 text-orange-600"
                  >
                    {isSelecting ? 'Loading…' : 'Select'}
                  </Button>
                  <Button
                    onClick={() => selectedDate && onAddNow(selectedDate)}
                    disabled={!selectedDate || isAdding}
                    className="bg-orange-500 text-white shadow hover:bg-orange-600"
                  >
                    {isAdding ? 'Adding…' : 'Add now'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
