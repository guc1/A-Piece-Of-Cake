'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function PlanningDateNav({
  date,
  today,
}: {
  date: string;
  today: string;
}) {
  const router = useRouter();
  const ctx = useViewContext();
  const [showPicker, setShowPicker] = useState(false);
  const minDate = addDays(today, 1);
  let base = '';
  if (ctx.mode === 'owner') {
    base = '/planning/next';
  } else if (ctx.mode === 'viewer' && ctx.viewId) {
    base = `/view/${ctx.viewId}/planning/next`;
  } else if (ctx.mode === 'historical') {
    if (ctx.viewerId === ctx.ownerId) {
      base = `/history/self/${ctx.snapshotDate}/planning/next`;
    } else if (ctx.viewId) {
      base = `/history/${ctx.viewId}/${ctx.snapshotDate}/planning/next`;
    }
  }
  function navigate(target: string) {
    if (!base) return;
    const next = target < minDate ? minDate : target;
    router.push(`${base}?date=${next}`);
  }
  const canNav = base !== '';
  const label = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  return (
    <div className="ml-auto flex items-center gap-2">
      <span className="text-sm">Planning for {label}</span>
      {canNav && (
        <>
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => setShowPicker((v) => !v)}
          >
            Change Date
          </button>
          {showPicker && (
            <input
              type="date"
              className="border p-1 text-sm"
              value={date}
              min={minDate}
              onChange={(e) => {
                const v = e.target.value;
                if (v >= minDate) navigate(v);
              }}
            />
          )}
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => navigate(addDays(date, 1))}
          >
            &gt;
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => navigate(addDays(date, 7))}
          >
            &gt;&gt;
          </button>
        </>
      )}
    </div>
  );
}
