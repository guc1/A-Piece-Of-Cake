'use client';

import { useMemo, useState, useEffect, Fragment } from 'react';
import BackButton from '@/components/back-button';
import { useViewContext } from '@/lib/view-context';
import { hrefFor } from '@/lib/navigation';
import {
  makeTrackingOverrideKey,
  type TrackingDataset,
  type TrackingDailyRecord,
  type TrackingFlavorSummary,
  type TrackingOverrideMap,
  type TrackingOverrideState,
  type TrackingOverrideTargetType,
  type TrackingSubflavorSummary,
} from '@/types/tracking';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';

const dayOptions = [1, 7, 14, 21, 30, 60, 90, 180, 270, 365];
const timeRangeOptions = [
  { label: '1 day', value: 1 },
  { label: '7 days', value: 7 },
  { label: '1 month', value: 30 },
  { label: '2 months', value: 60 },
  { label: 'Half year', value: 182 },
  { label: '1 year', value: 365 },
];

type DayState = 'not-started' | 'missed' | 'planned' | 'done';

type ChartDatum = {
  id: string;
  label: string;
  value: number;
  color: string;
  percent: number;
  helper?: string;
};

function parseYmd(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

function getCurrentYmd(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function lightenColor(hex: string, amount = 0.3) {
  if (!hex) return '#f97316';
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '#f97316';
  const num = parseInt(normalized, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const tint = (channel: number) =>
    Math.round(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${tint(r)}${tint(g)}${tint(b)}`;
}

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return hours >= 10 ? hours.toFixed(1) : hours.toFixed(2);
}

function StatusIndicator({
  state,
  label,
  highlight = false,
}: {
  state: DayState;
  label: string;
  highlight?: boolean;
}) {
  const highlightClass = highlight
    ? 'rounded-full ring-2 ring-orange-300 ring-offset-2 ring-offset-white'
    : '';
  switch (state) {
    case 'done':
      return (
        <span
          className={`flex h-7 w-7 items-center justify-center text-lg font-semibold text-green-500 transition ${highlightClass}`}
          title={`${label}: completed`}
          aria-label={`${label}: completed`}
        >
          ●
        </span>
      );
    case 'missed':
      return (
        <span
          className={`flex h-7 w-7 items-center justify-center text-lg font-semibold text-red-500 transition ${highlightClass}`}
          title={`${label}: not completed`}
          aria-label={`${label}: not completed`}
        >
          ×
        </span>
      );
    case 'planned':
      return (
        <span
          className={`flex h-7 w-7 items-center justify-center text-base font-semibold text-orange-500 transition ${highlightClass}`}
          title={`${label}: planned for today`}
          aria-label={`${label}: planned for today`}
        >
          ■
        </span>
      );
    default:
      return (
        <span
          className={`flex h-7 w-7 items-center justify-center text-base font-semibold text-gray-400 transition ${highlightClass}`}
          title={`${label}: tracking not started`}
          aria-label={`${label}: tracking not started`}
        >
          |||
        </span>
      );
  }
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <StatusIndicator state="done" label="Completed" />
        <span>Done</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator state="missed" label="Missed" />
        <span>Missed</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator state="planned" label="Planned" />
        <span>Planned today</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator state="not-started" label="Not started" />
        <span>Tracking not started</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator state="done" label="Manual override" highlight />
        <span>Manual override</span>
      </div>
    </div>
  );
}


function formatDayLabels(tz: string) {
  const dayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
  });
  const weekdayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  });
  return (ymd: string) => {
    const date = new Date(`${ymd}T00:00:00Z`);
    return {
      day: dayFmt.format(date),
      weekday: weekdayFmt.format(date),
    };
  };
}

function computeStatus(
  record: TrackingDailyRecord,
  dataset: TrackingDataset,
  createdAt: string,
  id: string,
  type: TrackingOverrideTargetType,
  overrides?: TrackingOverrideMap,
): DayState {
  const createdYmd = createdAt.slice(0, 10);
  if (record.date < createdYmd) return 'not-started';
  const overrideState = overrides?.[
    makeTrackingOverrideKey(type, id, record.date)
  ];
  if (overrideState) return overrideState;
  if (type === 'flavor') {
    if (record.doneFlavors.includes(id)) return 'done';
    if (record.date === dataset.today && record.plannedFlavors.includes(id)) {
      return 'planned';
    }
    return 'missed';
  }
  if (record.doneSubflavors.includes(id)) return 'done';
  if (record.date === dataset.today && record.plannedSubflavors.includes(id)) {
    return 'planned';
  }
  if (type === 'ingredient') {
    if (record.doneIngredients.includes(id)) return 'done';
    if (record.date === dataset.today && record.plannedIngredients.includes(id)) {
      return 'planned';
    }
    return 'missed';
  }
  return 'missed';
}

function buildChartData(
  records: TrackingDailyRecord[],
  flavors: TrackingFlavorSummary[],
  subflavors: TrackingSubflavorSummary[],
  hidden: Set<string>,
  mode: 'flavor' | 'subflavor',
  focusFlavorId?: string | null,
) {
  const flavorTotals = new Map<string, number>();
  const subTotals = new Map<string, number>();
  let totalMinutes = 0;
  for (const record of records) {
    totalMinutes += record.totalMinutes;
    for (const [id, minutes] of Object.entries(record.flavorMinutes)) {
      if (hidden.has(id)) continue;
      flavorTotals.set(id, (flavorTotals.get(id) ?? 0) + minutes);
    }
    for (const [id, minutes] of Object.entries(record.subflavorMinutes)) {
      if (hidden.has(id)) continue;
      subTotals.set(id, (subTotals.get(id) ?? 0) + minutes);
    }
  }
  const flavorData: ChartDatum[] = flavors
    .filter((f) => !hidden.has(f.id))
    .map((f) => ({
      id: f.id,
      label: f.name,
      value: flavorTotals.get(f.id) ?? 0,
      color: f.color || '#f97316',
      percent: 0,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const subData: ChartDatum[] = subflavors
    .filter((sf) => !hidden.has(sf.id) && !hidden.has(sf.flavorId))
    .filter((sf) => (mode === 'subflavor' && focusFlavorId ? sf.flavorId === focusFlavorId : true))
    .map((sf) => ({
      id: sf.id,
      label: sf.name,
      value: subTotals.get(sf.id) ?? 0,
      color: lightenColor(sf.color || '#f97316', 0.45),
      percent: 0,
      helper: sf.flavorId,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const working = mode === 'subflavor' ? subData : flavorData;
  const total = working.reduce((sum, item) => sum + item.value, 0);
  if (total > 0) {
    for (const item of working) {
      item.percent = Number(((item.value / total) * 100).toFixed(2));
    }
  }
  return { data: working, totalMinutes: totalMinutes, focusTotal: total };
}

function TrackingTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload as ChartDatum | undefined;
  if (!entry) return null;
  return (
    <div className="rounded-md border bg-white px-3 py-2 text-sm shadow">
      <div className="font-semibold text-gray-900">{entry.label}</div>
      <div className="text-gray-600">{formatHours(entry.value)} hrs</div>
      <div className="text-gray-500">{entry.percent.toFixed(2)}%</div>
    </div>
  );
}

export default function TrackingClient({ dataset }: { dataset: TrackingDataset }) {
  const ctx = useViewContext();
  const backHref = hrefFor('/progress', ctx);
  const [view, setView] = useState<'streaks' | 'time'>('streaks');
  const editable = ctx.editable;
  const [selectedDays, setSelectedDays] = useState(() => {
    const initial = Math.min(14, dataset.records.length || 1);
    return initial > 0 ? initial : 1;
  });
  const [autoExtend, setAutoExtend] = useState(false);
  const [autoDays, setAutoDays] = useState(0);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [timeRange, setTimeRange] = useState(() =>
    Math.min(7, dataset.records.length || 1),
  );
  const [chartMode, setChartMode] = useState<'flavor' | 'subflavor'>('flavor');
  const [focusedFlavor, setFocusedFlavor] = useState<string | null>(null);
  const [activeSlice, setActiveSlice] = useState<string | null>(null);
  const [overrideMap, setOverrideMap] = useState<TrackingOverrideMap>(
    () => ({ ...dataset.overrides }),
  );
  const [pendingOverrides, setPendingOverrides] = useState<Set<string>>(
    () => new Set(),
  );
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [showIngredients, setShowIngredients] = useState(true);

  useEffect(() => {
    if (!autoExtend) {
      setAutoDays(0);
      return;
    }
    const update = () => {
      const current = getCurrentYmd(dataset.timezone);
      const diff = Math.max(0, Math.round((parseYmd(current) - parseYmd(dataset.today)) / 86400000));
      setAutoDays(diff);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [autoExtend, dataset.timezone, dataset.today]);

  const maxSelectableDays = Math.max(dataset.records.length, 1);
  const resolvedDayCount = useMemo(() => {
    const base = Math.max(1, Math.min(selectedDays, maxSelectableDays));
    const extra = autoExtend ? autoDays : 0;
    return Math.max(1, Math.min(base + extra, maxSelectableDays));
  }, [selectedDays, autoExtend, autoDays, maxSelectableDays]);

  const visibleRecords = useMemo(() => {
    return dataset.records.slice(-resolvedDayCount);
  }, [dataset.records, resolvedDayCount]);

  const formatDay = useMemo(() => formatDayLabels(dataset.timezone), [dataset.timezone]);

  const flavorTree = useMemo(() => {
    const map = new Map<string, TrackingSubflavorSummary[]>();
    for (const sf of dataset.subflavors) {
      if (!map.has(sf.flavorId)) map.set(sf.flavorId, []);
      map.get(sf.flavorId)!.push(sf);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name));
    }
    return dataset.flavors.map((flavor) => ({
      flavor,
      subflavors: map.get(flavor.id) ?? [],
    }));
  }, [dataset.flavors, dataset.subflavors]);

  const visibleFlavors = useMemo(() => {
    return dataset.flavors.filter((flavor) => !hidden.has(flavor.id));
  }, [dataset.flavors, hidden]);

  useEffect(() => {
    if (visibleFlavors.length === 0) {
      if (focusedFlavor !== null) setFocusedFlavor(null);
      return;
    }
    const stillVisible = focusedFlavor
      ? visibleFlavors.some((flavor) => flavor.id === focusedFlavor)
      : false;
    if (!focusedFlavor || !stillVisible) {
      const next = visibleFlavors[0]?.id ?? null;
      if (next !== focusedFlavor) setFocusedFlavor(next);
    }
  }, [visibleFlavors, focusedFlavor]);

  const visibleRowCount = useMemo(() => {
    let count = 0;
    for (const { flavor, subflavors } of flavorTree) {
      if (hidden.has(flavor.id)) continue;
      count += 1;
      for (const sf of subflavors) {
        if (!hidden.has(sf.id)) count += 1;
      }
    }
    return count;
  }, [flavorTree, hidden]);

  const chartRecords = useMemo(() => {
    const range = Math.max(1, Math.min(timeRange, dataset.records.length));
    return dataset.records.slice(-range);
  }, [dataset.records, timeRange]);

  const effectiveFocusFlavor = useMemo(() => {
    if (chartMode !== 'subflavor') return null;
    if (!focusedFlavor) return null;
    if (hidden.has(focusedFlavor)) return null;
    return focusedFlavor;
  }, [chartMode, focusedFlavor, hidden]);

  const chartData = useMemo(() => {
    return buildChartData(
      chartRecords,
      dataset.flavors,
      dataset.subflavors,
      hidden,
      chartMode,
      effectiveFocusFlavor,
    );
  }, [
    chartRecords,
    dataset.flavors,
    dataset.subflavors,
    hidden,
    chartMode,
    effectiveFocusFlavor,
  ]);

  const availableRange = Math.max(dataset.records.length, 1);
  const rangeDays = chartRecords.length || timeRange;
  const totalHours = formatHours(chartData.totalMinutes);
  const focusHours = formatHours(chartData.focusTotal);

  const activeDetails = useMemo(() => {
    const lookup = new Map(chartData.data.map((item) => [item.id, item]));
    if (activeSlice && lookup.has(activeSlice)) {
      return lookup.get(activeSlice)!;
    }
    if (chartMode === 'flavor' && focusedFlavor && lookup.has(focusedFlavor)) {
      return lookup.get(focusedFlavor)!;
    }
    return chartData.data[0];
  }, [chartData.data, activeSlice, chartMode, focusedFlavor]);

  const isSubflavorMode = chartMode === 'subflavor';

  const focusFlavorName = useMemo(() => {
    if (!effectiveFocusFlavor) return null;
    const match = dataset.flavors.find((flavor) => flavor.id === effectiveFocusFlavor);
    return match?.name ?? null;
  }, [dataset.flavors, effectiveFocusFlavor]);

  const handleToggleFlavor = (id: string, parentId?: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (!parentId) {
          for (const sf of dataset.subflavors) {
            if (sf.flavorId === id) next.delete(sf.id);
          }
        }
      } else {
        next.add(id);
        if (!parentId) {
          for (const sf of dataset.subflavors) {
            if (sf.flavorId === id) next.add(sf.id);
          }
        }
      }
      return next;
    });
  };

  const handleShowAll = () => {
    setHidden(new Set());
  };

  const handleShowFlavorMix = () => {
    setChartMode('flavor');
    if (focusedFlavor) {
      setActiveSlice(focusedFlavor);
    }
  };

  const handleSwitchToSubflavor = () => {
    if (chartMode !== 'subflavor') {
      let nextFocus: string | null = null;
      if (activeSlice && dataset.flavors.some((flavor) => flavor.id === activeSlice)) {
        nextFocus = activeSlice;
      } else if (chartData.data.length > 0) {
        const candidate = chartData.data[0];
        if (dataset.flavors.some((flavor) => flavor.id === candidate.id)) {
          nextFocus = candidate.id;
        }
      }
      if (!nextFocus && visibleFlavors.length > 0) {
        nextFocus = visibleFlavors[0].id;
      }
      if (nextFocus && nextFocus !== focusedFlavor) {
        setFocusedFlavor(nextFocus);
      }
    }
    setChartMode('subflavor');
  };

  const handleFocusFlavorChange = (value: string) => {
    setFocusedFlavor(value ? value : null);
    if (chartMode === 'flavor' && value) {
      setActiveSlice(value);
    }
  };

  const toggleOverride = async (
    type: TrackingOverrideTargetType,
    targetId: string,
    createdAt: string,
    record: TrackingDailyRecord,
  ) => {
    if (!editable) return;
    const key = makeTrackingOverrideKey(type, targetId, record.date);
    if (pendingOverrides.has(key)) return;
    const baseState = computeStatus(record, dataset, createdAt, targetId, type);
    const effectiveState = computeStatus(
      record,
      dataset,
      createdAt,
      targetId,
      type,
      overrideMap,
    );
    if (effectiveState !== 'done' && effectiveState !== 'missed') return;
    const nextState: TrackingOverrideState =
      effectiveState === 'done' ? 'missed' : 'done';
    const shouldClear = nextState === baseState;
    const previousValue = overrideMap[key];
    setOverrideError(null);
    setPendingOverrides((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setOverrideMap((prev) => {
      const next = { ...prev };
      if (shouldClear) {
        delete next[key];
      } else {
        next[key] = nextState;
      }
      return next;
    });

    try {
      const response = await fetch('/api/progress/tracking/overrides', {
        method: shouldClear ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          shouldClear
            ? { targetType: type, targetId, date: record.date }
            : { targetType: type, targetId, date: record.date, state: nextState },
        ),
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update tracking override', error);
      setOverrideMap((prev) => {
        const next = { ...prev };
        if (previousValue) {
          next[key] = previousValue;
        } else {
          delete next[key];
        }
        return next;
      });
      setOverrideError('We couldn’t save that change. Please try again.');
    } finally {
      setPendingOverrides((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const renderStatusCell = (
    record: TrackingDailyRecord,
    createdAt: string,
    targetId: string,
    type: TrackingOverrideTargetType,
    label: string,
  ) => {
    const state = computeStatus(
      record,
      dataset,
      createdAt,
      targetId,
      type,
      overrideMap,
    );
    const key = makeTrackingOverrideKey(type, targetId, record.date);
    const isOverridden = Boolean(overrideMap[key]);
    const pending = pendingOverrides.has(key);
    const interactive = editable && (state === 'done' || state === 'missed');
    if (!interactive) {
      return (
        <StatusIndicator
          state={state}
          label={label}
          highlight={isOverridden}
        />
      );
    }
    const action = state === 'done' ? 'mark as missed' : 'mark as done';
    return (
      <button
        type="button"
        onClick={() => toggleOverride(type, targetId, createdAt, record)}
        className={`inline-flex items-center justify-center rounded-full p-0.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${
          pending ? 'cursor-wait opacity-60' : 'hover:scale-105'
        }`}
        title={`${action[0].toUpperCase() + action.slice(1)} (manual override)`}
        aria-label={`${label}: ${action}`}
        disabled={pending}
      >
        <StatusIndicator
          state={state}
          label={label}
          highlight={isOverridden}
        />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-orange-100 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <BackButton href={backHref} />
            <h1 className="text-3xl font-semibold text-gray-900">Progress Tracking</h1>
            <p className="text-gray-600">
              Visualise your streaks and time investment across every flavor and subflavor.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-orange-50 p-1 text-sm font-medium text-orange-600">
            <button
              type="button"
              onClick={() => setView('streaks')}
              className={`rounded-full px-4 py-2 transition ${
                view === 'streaks'
                  ? 'bg-white shadow-sm text-orange-600'
                  : 'text-orange-500 hover:text-orange-600'
              }`}
            >
              Streaks
            </button>
            <button
              type="button"
              onClick={() => setView('time')}
              className={`rounded-full px-4 py-2 transition ${
                view === 'time'
                  ? 'bg-white shadow-sm text-orange-600'
                  : 'text-orange-500 hover:text-orange-600'
              }`}
            >
              Time spent
            </button>
          </div>
        </div>
      </div>

      {view === 'streaks' ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-medium">Days shown</span>
              <select
                className="rounded-md border border-gray-200 px-3 py-1 text-sm"
                value={selectedDays}
                onChange={(event) => setSelectedDays(Number(event.target.value) || 1)}
              >
                {dayOptions
                  .filter((opt) => opt <= maxSelectableDays)
                  .map((opt) => (
                    <option key={opt} value={opt}>
                      Last {opt} days
                    </option>
                  ))}
                {!dayOptions.includes(maxSelectableDays) && (
                  <option value={maxSelectableDays}>All ({maxSelectableDays})</option>
                )}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={autoExtend}
                onChange={(event) => setAutoExtend(event.target.checked)}
              />
              <span>Activate +1 day automatically</span>
            </label>
            <div className="relative">
              <button
                type="button"
                className="rounded-full border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 shadow-sm transition hover:bg-orange-50"
                onClick={() => setFilterOpen((prev) => !prev)}
              >
                {filterOpen ? 'Close filters' : 'Hide flavors'}
              </button>
              {filterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-orange-100 bg-white p-4 shadow-lg">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Visible flavors</h3>
                    <button
                      type="button"
                      className="text-xs font-medium text-orange-600 hover:text-orange-500"
                      onClick={handleShowAll}
                    >
                      Show all
                    </button>
                  </div>
                  <div className="max-h-72 space-y-3 overflow-y-auto pr-1 text-sm">
                    {flavorTree.map(({ flavor, subflavors }) => (
                      <div key={flavor.id} className="space-y-2">
                        <label className="flex items-center gap-2 font-medium text-gray-800">
                          <input
                            type="checkbox"
                            checked={!hidden.has(flavor.id)}
                            onChange={() => handleToggleFlavor(flavor.id)}
                          />
                          <span>
                            <span className="mr-1 text-lg">{flavor.icon}</span>
                            {flavor.name}
                          </span>
                        </label>
                        {subflavors.length > 0 && (
                          <div className="ml-5 space-y-1 border-l border-dashed border-orange-200 pl-3 text-gray-600">
                            {subflavors.map((sf) => (
                              <label key={sf.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!hidden.has(sf.id) && !hidden.has(flavor.id)}
                                  onChange={() => handleToggleFlavor(sf.id, flavor.id)}
                                  disabled={hidden.has(flavor.id)}
                                />
                                <span>
                                  <span className="mr-1 text-lg">{sf.icon}</span>
                                  {sf.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {flavorTree.length === 0 && (
                      <p className="text-sm text-gray-500">No flavors available yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Legend />

          <div className="space-y-1 text-xs">
            <p className="text-gray-500">Manual overrides glow with a peach ring.</p>
            {editable && (
              <p className="text-orange-600">
                Click a done or missed marker to flip it—we&apos;ll remember your manual overrides.
              </p>
            )}
            {overrideError && (
              <p className="text-red-500" role="alert">
                {overrideError}
              </p>
            )}
          </div>

          <div className="overflow-x-auto rounded-3xl border border-orange-100 bg-white shadow-sm">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-left text-sm font-semibold text-gray-600 backdrop-blur">
                    Flavor
                  </th>
                  {visibleRecords.map((record) => {
                    const { day, weekday } = formatDay(record.date);
                    return (
                      <th
                        key={record.date}
                        className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500"
                      >
                        <div>{weekday}</div>
                        <div className="text-gray-700">{day}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {flavorTree.map(({ flavor, subflavors }) => {
                  if (hidden.has(flavor.id)) return null;
                  return (
                    <Fragment key={flavor.id}>
                      <tr className="align-middle">
                        <td className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-sm font-semibold text-gray-800 backdrop-blur">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-9 w-9 items-center justify-center rounded-full text-xl"
                              style={{ backgroundColor: `${flavor.color}22` }}
                            >
                              {flavor.icon}
                            </span>
                            <span>{flavor.name}</span>
                          </div>
                        </td>
                        {visibleRecords.map((record) => {
                          const label = `${flavor.name} on ${record.date}`;
                          return (
                            <td key={`${flavor.id}-${record.date}`} className="px-3 py-2 text-center">
                              {renderStatusCell(record, flavor.createdAt, flavor.id, 'flavor', label)}
                            </td>
                          );
                        })}
                      </tr>
                        {subflavors.map((sf) => {
                          if (hidden.has(sf.id)) return null;
                          return (
                            <tr key={sf.id} className="align-middle">
                            <td className="sticky left-0 z-10 bg-white/95 px-4 py-2 text-sm text-gray-700 backdrop-blur">
                              <div className="ml-8 flex items-center gap-3 border-l border-dashed border-orange-200 pl-4">
                                <span
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
                                  style={{ backgroundColor: `${sf.color}1f` }}
                                >
                                  {sf.icon}
                                </span>
                                <span>{sf.name}</span>
                              </div>
                            </td>
                            {visibleRecords.map((record) => {
                              const label = `${sf.name} on ${record.date}`;
                              return (
                                <td key={`${sf.id}-${record.date}`} className="px-3 py-2 text-center">
                                  {renderStatusCell(record, sf.createdAt, sf.id, 'subflavor', label)}
                                </td>
                              );
                            })}
                            </tr>
                          );
                        })}
                    </Fragment>
                  );
                })}
                {visibleRowCount === 0 && (
                  <tr>
                    <td
                      colSpan={visibleRecords.length + 1}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      Add flavors and subflavors to start tracking your streaks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Ingredient streaks</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>
                  Ingredients don&apos;t add to time totals—just streak accountability.
                </span>
                <button
                  type="button"
                  className="font-medium text-orange-600 hover:text-orange-500"
                  onClick={() => setShowIngredients((prev) => !prev)}
                >
                  {showIngredients ? 'Hide ingredient streaks' : 'Show ingredient streaks'}
                </button>
              </div>
            </div>
            {showIngredients ? (
              <div className="overflow-x-auto rounded-3xl border border-orange-100 bg-white shadow-sm">
                {dataset.ingredients.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-gray-500">
                    Add ingredients to track how consistently you bring your habits into play.
                  </div>
                ) : (
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-left text-sm font-semibold text-gray-600 backdrop-blur">
                          Ingredient
                        </th>
                        {visibleRecords.map((record) => {
                          const { day, weekday } = formatDay(record.date);
                          return (
                            <th
                              key={`ingredient-head-${record.date}`}
                              className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500"
                            >
                              <div>{weekday}</div>
                              <div className="text-gray-700">{day}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {dataset.ingredients.map((ingredient) => (
                        <tr key={ingredient.id} className="align-middle">
                          <td className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-sm font-semibold text-gray-800 backdrop-blur">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-lg">
                                {ingredient.icon}
                              </span>
                              <span>{ingredient.title}</span>
                            </div>
                          </td>
                          {visibleRecords.map((record) => {
                            const label = `${ingredient.title} on ${record.date}`;
                            return (
                              <td key={`${ingredient.id}-${record.date}`} className="px-3 py-2 text-center">
                                {renderStatusCell(record, ingredient.createdAt, ingredient.id, 'ingredient', label)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/50 px-6 py-8 text-center text-sm text-gray-500">
                Ingredient streaks are hidden right now.
                <button
                  type="button"
                  className="ml-2 font-semibold text-orange-600 hover:text-orange-500"
                  onClick={() => setShowIngredients(true)}
                >
                  Show them again
                </button>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-medium">Time range</span>
              <select
                className="rounded-md border border-gray-200 px-3 py-1 text-sm"
                value={timeRange}
                onChange={(event) => setTimeRange(Number(event.target.value) || 1)}
              >
                {timeRangeOptions
                  .filter((opt) => opt.value <= availableRange)
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                {!timeRangeOptions.some((opt) => opt.value === dataset.records.length) &&
                  dataset.records.length > 0 && (
                    <option value={dataset.records.length}>
                      Entire history ({dataset.records.length} days)
                    </option>
                  )}
              </select>
            </label>
            {isSubflavorMode && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">Focus flavor</span>
                <select
                  className="rounded-md border border-gray-200 px-3 py-1 text-sm"
                  value={effectiveFocusFlavor ?? ''}
                  onChange={(event) => handleFocusFlavorChange(event.target.value)}
                  disabled={visibleFlavors.length === 0}
                >
                  {visibleFlavors.length === 0 ? (
                    <option value="">No visible flavors</option>
                  ) : (
                    visibleFlavors.map((flavor) => (
                      <option key={flavor.id} value={flavor.id}>
                        {flavor.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
            )}
            <div className="flex items-center gap-2 rounded-full bg-orange-50 p-1 text-sm font-medium text-orange-600">
              <button
                type="button"
                onClick={handleShowFlavorMix}
                className={`rounded-full px-4 py-2 transition ${
                  chartMode === 'flavor'
                    ? 'bg-white shadow-sm text-orange-600'
                    : 'text-orange-500 hover:text-orange-600'
                }`}
              >
                Main flavor mix
              </button>
              <button
                type="button"
                onClick={handleSwitchToSubflavor}
                className={`rounded-full px-4 py-2 transition ${
                  chartMode === 'subflavor'
                    ? 'bg-white shadow-sm text-orange-600'
                    : 'text-orange-500 hover:text-orange-600'
                }`}
              >
                Subflavor diagram
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            {chartData.data.length === 0
              ? isSubflavorMode
                ? effectiveFocusFlavor
                  ? `No time logged in the last ${rangeDays} day${rangeDays === 1 ? '' : 's'} for subflavors tagged under ${focusFlavorName ?? 'this flavor'} yet.`
                  : 'Choose a flavor above to inspect its subflavor mix.'
                : `No time logged in the last ${rangeDays} day${rangeDays === 1 ? '' : 's'} for this view yet.`
              : `Logged ${totalHours} hrs in the last ${rangeDays} day${rangeDays === 1 ? '' : 's'}. ` +
                (isSubflavorMode
                  ? focusFlavorName
                    ? `${focusFlavorName} subflavors account for ${focusHours} hrs of that total.`
                    : 'Select a flavor to see its subflavor distribution.'
                  : 'Every tracked flavor is represented below.')}
          </p>

          <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
            <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
              {chartData.data.length === 0 ? (
                <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-gray-500">
                  {isSubflavorMode
                    ? effectiveFocusFlavor
                      ? 'No tracked time for these subflavors in this range yet.'
                      : 'Select a flavor above to view its subflavor breakdown.'
                    : 'Tag your time blocks with flavors to see time distribution.'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={chartData.data}
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={(_: unknown, index: number) =>
                        setActiveSlice(chartData.data[index]?.id ?? null)
                      }
                      onMouseLeave={() => setActiveSlice(null)}
                    >
                      {chartData.data.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={entry.color || '#f97316'}
                          onClick={() => {
                            setActiveSlice(entry.id);
                            if (chartMode === 'flavor') {
                              setFocusedFlavor(entry.id);
                            }
                          }}
                          style={{ cursor: chartMode === 'flavor' ? 'pointer' : 'default' }}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<TrackingTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {isSubflavorMode
                  ? `Subflavor insights${focusFlavorName ? ` – ${focusFlavorName}` : ''}`
                  : 'Flavor insights'}
              </h3>
              <div className="space-y-3">
                {chartData.data.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {isSubflavorMode
                      ? effectiveFocusFlavor
                        ? 'Log activities with detailed subflavor tags to populate this insight.'
                        : 'Select a flavor above to explore its subflavor mix.'
                      : 'Once you start logging activities, this panel will highlight where your time is going.'}
                  </p>
                ) : (
                  chartData.data.map((item) => {
                    const isActive = activeDetails?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setActiveSlice(item.id)}
                        onFocus={() => setActiveSlice(item.id)}
                        onClick={() => {
                          setActiveSlice(item.id);
                          if (chartMode === 'flavor') {
                            setFocusedFlavor(item.id);
                          }
                        }}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          isActive
                            ? 'border-orange-300 bg-orange-50 shadow-sm'
                            : 'border-transparent hover:border-orange-200 hover:bg-orange-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                            {isSubflavorMode && item.helper && (
                              <div className="text-xs text-gray-500">
                                Within {focusFlavorName ?? dataset.flavors.find((f) => f.id === item.helper)?.name}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm font-medium text-gray-700">
                            <div>{formatHours(item.value)} hrs</div>
                            <div className="text-xs text-gray-500">{item.percent.toFixed(2)}%</div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
