'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import type { DailyProgressRecord } from '@/lib/progress-tracking-store';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

type FlavorInfo = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
};

type SubflavorInfo = {
  id: string;
  flavorId: string;
  name: string;
  icon: string;
  color: string;
  description: string;
};

type Props = {
  today: string;
  timeZone: string;
  trackingStart: string | null;
  flavors: FlavorInfo[];
  subflavors: SubflavorInfo[];
  timeline: DailyProgressRecord[];
};

type StatusType = 'done' | 'planned' | 'missed' | 'notStarted';

type AutoConfig = {
  enabled: boolean;
  baseDays: number;
  anchor: string;
};

const DAY_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '180 days' },
  { value: 365, label: '365 days' },
];

const TIME_RANGES = [
  { key: '1d', label: '1 day', days: 1 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '1m', label: '1 month', days: 30 },
  { key: '2m', label: '2 months', days: 60 },
  { key: '6m', label: 'Half year', days: 182 },
  { key: '1y', label: '1 year', days: 365 },
];

const AUTO_STORAGE_KEY = 'apoc-tracking-auto';
const HIDDEN_STORAGE_KEY = 'apoc-tracking-hidden';

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
});

function createDateFromYMD(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function shiftDate(date: string, offset: number) {
  const base = createDateFromYMD(date);
  const shifted = new Date(base.getTime() + offset * 86_400_000);
  return shifted.toISOString().slice(0, 10);
}

function diffInDays(start: string, end: string) {
  const startDate = createDateFromYMD(start);
  const endDate = createDateFromYMD(end);
  return Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000);
}

function clampDays(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return 30;
  const rounded = Math.round(value);
  if (rounded < 1) return 1;
  if (rounded > 365) return 365;
  return rounded;
}

function formatDayLabel(date: string) {
  return dayFormatter.format(createDateFromYMD(date));
}

function formatWeekday(date: string) {
  return weekdayFormatter.format(createDateFromYMD(date));
}

function statusTitle(status: StatusType) {
  switch (status) {
    case 'done':
      return 'Completed';
    case 'planned':
      return 'Planned';
    case 'notStarted':
      return 'Tracking not started';
    default:
      return 'Missed';
  }
}

function StatusCell({ status, isToday }: { status: StatusType; isToday: boolean }) {
  const base = 'flex h-9 w-9 items-center justify-center text-sm font-semibold transition-colors';
  const ring = isToday ? 'ring-2 ring-orange-300 ring-offset-2' : '';
  if (status === 'done') {
    return (
      <div
        className={cn(
          base,
          'rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-200',
          ring,
        )}
        title={statusTitle(status)}
      >
        ✓
      </div>
    );
  }
  if (status === 'planned') {
    return (
      <div
        className={cn(
          base,
          'rounded-md border border-orange-400 bg-orange-50 text-orange-600 shadow-sm',
          ring,
        )}
        title={statusTitle(status)}
      >
        ▢
      </div>
    );
  }
  if (status === 'notStarted') {
    return (
      <div
        className={cn(
          base,
          'rounded-md border border-gray-200 bg-gray-100 text-gray-400',
          ring,
        )}
        title={statusTitle(status)}
      >
        |||
      </div>
    );
  }
  return (
    <div
      className={cn(
        base,
        'rounded-md border border-red-200 bg-red-50 text-red-500 shadow-sm',
        ring,
      )}
      title={statusTitle(status)}
    >
      ✕
    </div>
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const minutes: number = item?.payload?.minutes ?? 0;
  const name: string = item?.payload?.name ?? '';
  const percent: number = item?.percent ? item.percent * 100 : 0;
  const hours = minutes / 60;
  return (
    <div className="rounded-lg bg-white/95 p-3 text-sm shadow-xl">
      <div className="font-semibold text-gray-800">{name}</div>
      <div className="text-gray-600">{hours.toFixed(1)} hours</div>
      <div className="text-gray-500">{percent.toFixed(1)}%</div>
    </div>
  );
}

export default function TrackingClient({
  today,
  timeZone: _timeZone,
  trackingStart,
  flavors,
  subflavors,
  timeline,
}: Props) {
  const [view, setView] = useState<'streaks' | 'time'>('streaks');
  const [autoConfig, setAutoConfig] = useState<AutoConfig>(() => ({
    enabled: false,
    baseDays: 30,
    anchor: today,
  }));
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [showSubDistribution, setShowSubDistribution] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(AUTO_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AutoConfig>;
      if (!parsed) return;
      setAutoConfig({
        enabled: !!parsed.enabled,
        baseDays: clampDays(parsed.baseDays ?? 30),
        anchor: typeof parsed.anchor === 'string' ? parsed.anchor : today,
      });
    } catch {
      // ignore invalid stored state
    }
  }, [today]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      if (!Array.isArray(parsed)) return;
      setHidden(new Set(parsed.filter((entry) => typeof entry === 'string')));
    } catch {
      // ignore stored errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTO_STORAGE_KEY, JSON.stringify(autoConfig));
  }, [autoConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(Array.from(hidden)));
  }, [hidden]);

  const displayDays = useMemo(() => {
    const base = clampDays(autoConfig.baseDays);
    if (!autoConfig.enabled) return base;
    const diff = Math.max(0, diffInDays(autoConfig.anchor, today));
    return Math.min(365, base + diff);
  }, [autoConfig, today]);

  const dayLabels = useMemo(() => {
    const result: string[] = [];
    for (let i = displayDays - 1; i >= 0; i--) {
      result.push(shiftDate(today, -i));
    }
    return result;
  }, [displayDays, today]);

  const recordsMap = useMemo(() => {
    const map = new Map<string, DailyProgressRecord>();
    for (const record of timeline) {
      map.set(record.date, record);
    }
    return map;
  }, [timeline]);

  const flavorMap = useMemo(() => {
    const map = new Map<string, FlavorInfo>();
    for (const flavor of flavors) map.set(flavor.id, flavor);
    return map;
  }, [flavors]);

  const subMap = useMemo(() => {
    const map = new Map<string, SubflavorInfo>();
    for (const sub of subflavors) map.set(sub.id, sub);
    return map;
  }, [subflavors]);

  const visibleFlavorIds = useMemo(() => {
    const set = new Set<string>();
    for (const flavor of flavors) {
      const key = `f:${flavor.id}`;
      if (!hidden.has(key)) set.add(flavor.id);
    }
    return set;
  }, [flavors, hidden]);

  const visibleSubIds = useMemo(() => {
    const set = new Set<string>();
    for (const sub of subflavors) {
      const key = `s:${sub.id}`;
      if (visibleFlavorIds.has(sub.flavorId) && !hidden.has(key)) set.add(sub.id);
    }
    return set;
  }, [subflavors, visibleFlavorIds, hidden]);

  const groupedSubs = useMemo(() => {
    const map = new Map<string, SubflavorInfo[]>();
    for (const sub of subflavors) {
      if (!visibleSubIds.has(sub.id)) continue;
      if (!map.has(sub.flavorId)) map.set(sub.flavorId, []);
      map.get(sub.flavorId)!.push(sub);
    }
    return map;
  }, [subflavors, visibleSubIds]);

  const visibleFlavorsList = useMemo(
    () => flavors.filter((flavor) => visibleFlavorIds.has(flavor.id)),
    [flavors, visibleFlavorIds],
  );

  const rangeDays = useMemo(() => {
    const option = TIME_RANGES.find((opt) => opt.key === timeRange);
    return option ? option.days : 7;
  }, [timeRange]);

  const rangeDates = useMemo(() => {
    const result: string[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      result.push(shiftDate(today, -i));
    }
    return result;
  }, [rangeDays, today]);

  function getFlavorStatus(date: string, flavorId: string): StatusType {
    if (trackingStart && date < trackingStart) return 'notStarted';
    const record = recordsMap.get(date);
    if (!record) return 'missed';
    const entry = record.flavors.find((f) => f.flavorId === flavorId);
    if (!entry) return 'missed';
    if (entry.done) return 'done';
    if (entry.planned) return 'planned';
    return 'missed';
  }

  function getSubStatus(date: string, subId: string): StatusType {
    if (trackingStart && date < trackingStart) return 'notStarted';
    const record = recordsMap.get(date);
    if (!record) return 'missed';
    for (const entry of record.flavors) {
      const subEntry = entry.subflavors.find((sf) => sf.subflavorId === subId);
      if (subEntry) {
        if (subEntry.done) return 'done';
        if (subEntry.planned) return 'planned';
        return 'missed';
      }
    }
    return 'missed';
  }

  const flavorChartData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const date of rangeDates) {
      const record = recordsMap.get(date);
      if (!record) continue;
      for (const entry of record.flavors) {
        if (!visibleFlavorIds.has(entry.flavorId)) continue;
        totals.set(
          entry.flavorId,
          (totals.get(entry.flavorId) ?? 0) + (entry.minutes ?? 0),
        );
      }
    }
    const items = Array.from(totals.entries())
      .map(([id, minutes]) => {
        const flavor = flavorMap.get(id);
        return {
          id,
          name: flavor?.name || 'Flavor',
          parentName: '',
          minutes,
          value: minutes,
          color: flavor?.color || '#f97316',
          icon: flavor?.icon || '🍰',
        };
      })
      .filter((item) => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
    return items;
  }, [rangeDates, recordsMap, visibleFlavorIds, flavorMap]);

  const subChartData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const date of rangeDates) {
      const record = recordsMap.get(date);
      if (!record) continue;
      for (const entry of record.flavors) {
        for (const subEntry of entry.subflavors) {
          if (!visibleSubIds.has(subEntry.subflavorId)) continue;
          totals.set(
            subEntry.subflavorId,
            (totals.get(subEntry.subflavorId) ?? 0) + (subEntry.minutes ?? 0),
          );
        }
      }
    }
    const items = Array.from(totals.entries())
      .map(([id, minutes]) => {
        const sub = subMap.get(id);
        const parent = sub ? flavorMap.get(sub.flavorId) : undefined;
        return {
          id,
          name: sub?.name || 'Subflavor',
          parentName: parent?.name || '',
          minutes,
          value: minutes,
          color: sub?.color || parent?.color || '#f97316',
        };
      })
      .filter((item) => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
    return items;
  }, [rangeDates, recordsMap, visibleSubIds, subMap, flavorMap]);

  const pieData = showSubDistribution ? subChartData : flavorChartData;
  const totalMinutes = useMemo(
    () => pieData.reduce((sum, item) => sum + (item.minutes ?? 0), 0),
    [pieData],
  );

  function toggleFlavorVisibility(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      const key = `f:${id}`;
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleSubVisibility(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      const key = `s:${id}`;
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleDayOptionChange(value: number) {
    setAutoConfig((cfg) => ({ ...cfg, baseDays: clampDays(value) }));
  }

  function toggleAutoExtend() {
    setAutoConfig((cfg) => {
      if (cfg.enabled) return { ...cfg, enabled: false };
      return { enabled: true, baseDays: clampDays(cfg.baseDays), anchor: today };
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-full bg-gray-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setView('streaks')}
            className={cn(
              'rounded-full px-4 py-2 transition-colors',
              view === 'streaks'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            Streaks
          </button>
          <button
            type="button"
            onClick={() => setView('time')}
            className={cn(
              'rounded-full px-4 py-2 transition-colors',
              view === 'time'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            Time spent
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Data reflects flavours attached to your time blocks.
        </p>
      </div>

      {view === 'streaks' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white/80 p-4 shadow-sm">
            <div className="flex items-center gap-3 text-sm">
              <label className="font-semibold text-gray-700" htmlFor="tracking-days">
                Days to display
              </label>
              <select
                id="tracking-days"
                value={autoConfig.baseDays}
                onChange={(e) => handleDayOptionChange(Number(e.target.value))}
                className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {DAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button
                type="button"
                onClick={toggleAutoExtend}
                className={cn(
                  'rounded-full px-4 py-2 font-semibold transition-colors',
                  autoConfig.enabled
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                    : 'border border-orange-400 text-orange-600 hover:bg-orange-50',
                )}
              >
                Activate +1
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen((open) => !open)}
                  className="rounded-full border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Hide flavours
                </button>
                {filterOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border bg-white/95 p-4 text-sm shadow-2xl">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Choose visibility</span>
                      <button
                        type="button"
                        className="text-lg text-gray-400 hover:text-gray-600"
                        onClick={() => setFilterOpen(false)}
                        aria-label="Close flavour filter"
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
                      {flavors.map((flavor) => {
                        const flavorKey = `f:${flavor.id}`;
                        const subs = subflavors.filter((sub) => sub.flavorId === flavor.id);
                        return (
                          <div key={flavor.id} className="rounded-lg bg-gray-50/60 px-3 py-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <input
                                type="checkbox"
                                checked={!hidden.has(flavorKey)}
                                onChange={() => toggleFlavorVisibility(flavor.id)}
                              />
                              <span className="flex items-center gap-2">
                                <span className="text-base">{flavor.icon || '🍰'}</span>
                                <span>{flavor.name || 'Unnamed flavour'}</span>
                              </span>
                            </label>
                            {subs.length > 0 && (
                              <div className="mt-2 space-y-1 pl-6">
                                {subs.map((sub) => {
                                  const subKey = `s:${sub.id}`;
                                  return (
                                    <label
                                      key={sub.id}
                                      className="flex items-center gap-2 text-xs text-gray-600"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={!hidden.has(subKey)}
                                        disabled={hidden.has(flavorKey)}
                                        onChange={() => toggleSubVisibility(sub.id)}
                                      />
                                      <span className="flex items-center gap-2">
                                        <span>{sub.icon || '•'}</span>
                                        <span>{sub.name || 'Subflavor'}</span>
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilterOpen(false)}
                      className="mt-4 w-full rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-200"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Showing the last {displayDays} days.{' '}
            {autoConfig.enabled
              ? 'A new day slides in automatically every midnight.'
              : 'Enable Activate +1 to automatically reveal each new day.'}
          </p>
          {visibleFlavorsList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/70 p-8 text-center text-sm text-orange-600">
              Select at least one flavour or subflavour in the filter to light up the grid.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-white/80 p-4 shadow-lg backdrop-blur-sm">
              <div
                className="grid gap-2 text-xs"
                style={{
                  gridTemplateColumns: `220px repeat(${dayLabels.length}, minmax(36px, 1fr))`,
                }}
              >
                <div className="text-left text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Flavour
                </div>
                {dayLabels.map((date) => {
                  const isToday = date === today;
                  return (
                    <div
                      key={date}
                      className={cn(
                        'flex flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[11px] font-semibold',
                        isToday ? 'bg-orange-100 text-orange-700' : 'text-gray-500',
                      )}
                    >
                      <span>{formatWeekday(date)}</span>
                      <span>{formatDayLabel(date)}</span>
                    </div>
                  );
                })}
                {visibleFlavorsList.map((flavor) => {
                  const subs = groupedSubs.get(flavor.id) ?? [];
                  const color = flavor.color || '#f97316';
                  return (
                    <Fragment key={flavor.id}>
                      <div className="flex items-center gap-3 rounded-xl bg-white/90 px-3 py-3 text-sm font-semibold text-gray-800 shadow-sm">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                          style={{ backgroundColor: `${color}20`, color: color }}
                        >
                          {flavor.icon || '🍰'}
                        </span>
                        <div className="flex-1">
                          <div>{flavor.name || 'Unnamed flavour'}</div>
                          <div className="text-xs font-normal text-gray-500">
                            {flavor.description || 'Planned via time blocks'}
                          </div>
                        </div>
                      </div>
                      {dayLabels.map((date) => (
                        <div key={`${flavor.id}-${date}`} className="flex items-center justify-center">
                          <StatusCell
                            status={getFlavorStatus(date, flavor.id)}
                            isToday={date === today}
                          />
                        </div>
                      ))}
                      {subs.map((sub) => {
                        const subColor = sub.color || color;
                        return (
                          <Fragment key={sub.id}>
                            <div
                              className="ml-6 flex items-center gap-3 rounded-xl border-l-4 bg-white/80 px-3 py-2 text-xs font-medium text-gray-600"
                              style={{ borderColor: subColor }}
                            >
                              <span className="text-base text-gray-500">{sub.icon || '•'}</span>
                              <div>
                                <div>{sub.name || 'Subflavor'}</div>
                                {sub.description && (
                                  <div className="text-[10px] text-gray-400">{sub.description}</div>
                                )}
                              </div>
                            </div>
                            {dayLabels.map((date) => (
                              <div key={`${sub.id}-${date}`} className="flex items-center justify-center">
                                <StatusCell
                                  status={getSubStatus(date, sub.id)}
                                  isToday={date === today}
                                />
                              </div>
                            ))}
                          </Fragment>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {TIME_RANGES.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTimeRange(opt.key)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    timeRange === opt.key
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'border border-orange-300 text-orange-600 hover:bg-orange-50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowSubDistribution((prev) => !prev)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                showSubDistribution
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-200'
                  : 'border border-purple-300 text-purple-600 hover:bg-purple-50',
              )}
            >
              {showSubDistribution ? 'View main flavours' : 'See subflavour distribution'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Hours calculated in your { _timeZone } timezone.
          </p>
          {pieData.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/70 p-10 text-center text-sm text-orange-600">
              No completed time blocks in this range yet. Tag your activities with flavours to power this view.
            </div>
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="h-80 w-full rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur-sm lg:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color || '#f97316'} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3 rounded-2xl border bg-white/90 p-4 shadow-lg backdrop-blur-sm">
                {pieData.map((entry) => {
                  const hours = entry.minutes / 60;
                  const percent = totalMinutes ? (entry.minutes / totalMinutes) * 100 : 0;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: entry.color || '#f97316' }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{entry.name}</div>
                          {entry.parentName && (
                            <div className="text-xs text-gray-500">{entry.parentName}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <div>{hours.toFixed(1)} h</div>
                        <div>{percent.toFixed(1)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
