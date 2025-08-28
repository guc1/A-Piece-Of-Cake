'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export type DayScore = { date: string; score: number };
export type RangeScore = {
  startDate: string;
  endDate: string;
  score: number;
};

const WINDOWS = [
  { key: 'avg7', label: '7 day average', days: 7, color: '#3b82f6' },
  { key: 'avg14', label: '2 week average', days: 14, color: '#10b981' },
  { key: 'avg30', label: '1 month average', days: 30, color: '#ef4444' },
  { key: 'avg90', label: '3 month average', days: 90, color: '#8b5cf6' },
  { key: 'avg182', label: '6 month average', days: 182, color: '#0ea5e9' },
  { key: 'avg365', label: 'Yearly average', days: 365, color: '#f59e0b' },
] as const;

type Props = {
  daily: DayScore[];
  weekly: RangeScore[];
  monthly: RangeScore[];
  yearly: RangeScore[];
};

function buildDailyData(daily: DayScore[], startDate: string) {
  const map = new Map<string, number>();
  for (const d of daily) map.set(d.date, d.score);
  const today = new Date();
  const days: DayScore[] = [];
  const indexMap = new Map<string, number>();
  for (let i = 365; i >= 0; i--) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - i);
    const ymd = dt.toISOString().slice(0, 10);
    indexMap.set(ymd, days.length);
    days.push({ date: ymd, score: map.get(ymd) ?? 0 });
  }
  const startIdx = startDate ? days.findIndex((d) => d.date >= startDate) : 0;
  const avgs: Record<string, Array<number | null>> = {};
  for (const w of WINDOWS) {
    const arr: Array<number | null> = new Array(days.length).fill(null);
    let sum = 0;
    for (let i = startIdx; i < days.length; i++) {
      sum += days[i].score;
      if (i - w.days >= startIdx) sum -= days[i - w.days].score;
      const denom = Math.min(w.days, i - startIdx + 1);
      arr[i] = sum / denom;
    }
    avgs[w.key] = arr;
  }
  return { days, avgs, startIdx, indexMap };
}

function buildRangeChart(
  ranges: RangeScore[],
  avgs: Record<string, Array<number | null>>,
  indexMap: Map<string, number>,
  label: (r: RangeScore) => string,
) {
  const recent = ranges.slice(0, 7).reverse();
  return recent.map((r) => {
    const item: any = { date: label(r), score: r.score };
    const idx = indexMap.get(r.endDate);
    if (idx !== undefined) {
      for (const win of WINDOWS) item[win.key] = avgs[win.key][idx];
    }
    return item;
  });
}

export default function StatisticsClient({ daily, weekly, monthly, yearly }: Props) {
  const [tab, setTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
    'daily',
  );
  const [start, setStart] = useState('');
  const [active, setActive] = useState<Record<string, boolean>>({});

  const { days, avgs, startIdx, indexMap } = useMemo(
    () => buildDailyData(daily, start),
    [daily, start],
  );
  const dailyChart = useMemo(() => {
    const slice = days.slice(-7);
    const offset = days.length - slice.length;
    return slice.map((d, i) => {
      const idx = offset + i;
      const item: any = { date: d.date.slice(5), score: d.score };
      for (const win of WINDOWS) item[win.key] = avgs[win.key][idx];
      return item;
    });
  }, [days, avgs]);

  const weeklyChart = useMemo(
    () =>
      buildRangeChart(
        weekly,
        avgs,
        indexMap,
        (r) => `${r.startDate.slice(5)}-${r.endDate.slice(5)}`,
      ),
    [weekly, avgs, indexMap],
  );
  const monthlyChart = useMemo(
    () =>
      buildRangeChart(monthly, avgs, indexMap, (r) => r.startDate.slice(0, 7)),
    [monthly, avgs, indexMap],
  );
  const yearlyChart = useMemo(
    () =>
      buildRangeChart(yearly, avgs, indexMap, (r) => r.startDate.slice(0, 4)),
    [yearly, avgs, indexMap],
  );

  const data =
    tab === 'weekly'
      ? weeklyChart
      : tab === 'monthly'
        ? monthlyChart
        : tab === 'yearly'
          ? yearlyChart
          : dailyChart;

  const availableDays = days.length - startIdx;

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
          <button
            key={t}
            className={
              tab === t
                ? 'border-b-2 border-orange-500 pb-1 font-semibold'
                : 'pb-1'
            }
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm">Average start:</label>
        <input
          type="date"
          value={start}
          min={days[0].date}
          max={days[days.length - 1].date}
          onChange={(e) => setStart(e.target.value)}
          className="rounded border px-2 py-1"
        />
        <button
          onClick={() => setStart('')}
          className="text-sm text-orange-600 underline"
        >
          All
        </button>
      </div>
      <div className="flex flex-wrap gap-4">
        {WINDOWS.map((w) => {
          const disabled = availableDays < w.days;
          return (
            <label key={w.key} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                disabled={disabled}
                checked={!!active[w.key] && !disabled}
                onChange={() =>
                  setActive((a) => ({ ...a, [w.key]: !a[w.key] }))
                }
              />
              <span>{w.label}</span>
            </label>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ left: 20, right: 20 }}>
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="score" fill="#f97316" />
          {WINDOWS.map(
            (w) =>
              active[w.key] && (
                <Line
                  key={w.key}
                  type="monotone"
                  dataKey={w.key}
                  stroke={w.color}
                  dot={false}
                />
              ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
