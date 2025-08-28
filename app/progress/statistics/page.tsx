'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type DataPoint = { date: string; score: number } & Record<string, number | string>;

const avgOptions = [
  { key: 'ma7', label: '7 day avg', size: 7, color: '#f97316' },
  { key: 'ma14', label: '2 week avg', size: 14, color: '#8884d8' },
  { key: 'ma30', label: '1 month avg', size: 30, color: '#22c55e' },
  { key: 'ma90', label: '3 month avg', size: 90, color: '#eab308' },
  { key: 'ma180', label: '6 month avg', size: 180, color: '#06b6d4' },
  { key: 'ma365', label: 'Year avg', size: 365, color: '#ec4899' },
];

function generateSampleData(days: number): DataPoint[] {
  const res: DataPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const score =
      Math.random() < 0.15 ? 0 : Math.round(Math.random() * 100);
    res.push({ date: d.toISOString().slice(0, 10), score });
  }
  return res;
}

function addMovingAverages(data: DataPoint[], start: number): DataPoint[] {
  const sizes = avgOptions.map((o) => o.size);
  return data.map((d, i) => {
    const entry: DataPoint = { ...d };
    for (const s of sizes) {
      if (i >= start + s - 1) {
        const slice = data.slice(i - s + 1, i + 1);
        entry[`ma${s}`] =
          slice.reduce((sum, p) => sum + p.score, 0) / s;
      }
    }
    return entry;
  });
}

export default function StatisticsPage() {
  const [timeframe, setTimeframe] =
    useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [selected, setSelected] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('all');

  // sample data; in the real app this will come from daily assessments
  const rawData = generateSampleData(400);
  const startIndex =
    startDate === 'all'
      ? 0
      : rawData.findIndex((d) => d.date >= startDate);
  const start = startIndex === -1 ? rawData.length : startIndex;
  const dataWithAvg = addMovingAverages(rawData, start);
  const displayData = dataWithAvg.slice(-7);
  const available = avgOptions.filter(
    (o) => rawData.length - start >= o.size,
  );

  const toggle = (key: string) =>
    setSelected((p) =>
      p.includes(key) ? p.filter((k) => k !== key) : [...p, key],
    );

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(
          (tf) => (
            <button
              key={tf}
              className={`px-4 py-2 rounded ${
                timeframe === tf
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200'
              }`}
              onClick={() => setTimeframe(tf)}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ),
        )}
      </div>

      {timeframe !== 'daily' ? (
        <div className="p-4 text-gray-500">
          {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}{' '}
          view coming soon.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {available.map((o) => (
              <button
                key={o.key}
                className={`px-3 py-1 rounded border ${
                  selected.includes(o.key)
                    ? 'bg-orange-500 text-white'
                    : 'bg-white'
                }`}
                onClick={() => toggle(o.key)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="start-avg"
              className="text-sm text-zinc-700"
            >
              Start averages from:
            </label>
            <input
              id="start-avg"
              type="date"
              value={startDate === 'all' ? '' : startDate}
              onChange={(e) =>
                setStartDate(e.target.value || 'all')
              }
              className="rounded border px-2 py-1"
            />
            {startDate !== 'all' && (
              <button
                className="text-sm text-orange-600 underline"
                onClick={() => setStartDate('all')}
              >
                All data
              </button>
            )}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={displayData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#f97316" />
              {selected.map((key) => {
                const opt = avgOptions.find((o) => o.key === key)!;
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={`ma${opt.size}`}
                    stroke={opt.color}
                    dot={false}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

