'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useViewContext } from '@/lib/view-context';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
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
    router.push(`${base}?date=${target}`);
  }
  const canNav = base !== '';
  const label = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  return (
    <div className="mb-2 flex justify-end items-center gap-2">
      <span className="text-sm">Planning for {label}</span>
      {canNav && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPicker((v) => !v)}
          >
            Change Date
          </Button>
          {showPicker && (
            <input
              type="date"
              className="border p-1 text-sm"
              value={date}
              min={minDate}
              onChange={(e) => navigate(e.target.value)}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(addDays(date, 1))}
          >
            {'>'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(addDays(date, 7))}
          >
            {'>>'}
          </Button>
        </>
      )}
    </div>
  );
}
