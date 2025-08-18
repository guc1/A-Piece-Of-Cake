'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useViewContext } from '@/lib/view-context';

export function SideCalendar({
  snapshotDates = [],
}: {
  snapshotDates?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const ctx = useViewContext();
  const snapshotSet = useMemo(() => new Set(snapshotDates), [snapshotDates]);

  const today = new Date();
  const base = new Date(today);
  base.setMonth(base.getMonth() + monthOffset);

  const start = new Date(base);
  start.setDate(start.getDate() - 30);
  const end = new Date(base);
  end.setDate(end.getDate() + 7);

  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const monthLabel = base.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 flex items-center z-50">
      <button
        onClick={() => setOpen((p) => !p)}
        className="bg-orange-500 text-white px-2 py-1 rounded-r shadow focus:outline-none"
        aria-label={open ? 'Close calendar' : 'Open calendar'}
      >
        {open ? '❮' : '❯'}
      </button>
      <div
        className={cn(
          'ml-1 transition-all duration-300',
          open
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0 pointer-events-none',
        )}
      >
        <div className="w-64 rounded-lg bg-white dark:bg-zinc-900 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => setMonthOffset((p) => p - 1)}
              className="px-1"
              aria-label="Previous month"
            >
              ❮
            </button>
            <h2 className="text-center font-semibold flex-1">{monthLabel}</h2>
            <button
              onClick={() => setMonthOffset((p) => p + 1)}
              className="px-1"
              aria-label="Next month"
            >
              ❯
            </button>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
            {weekDays.map((d) => (
              <div key={d} className="font-medium">
                {d}
              </div>
            ))}
            {days.map((date) => {
              const isToday = date.toDateString() === today.toDateString();
              const iso = date.toISOString().slice(0, 10);
              const hasSnapshot = snapshotSet.has(iso);
              const day = (
                <div
                  className={cn(
                    'p-1 rounded',
                    isToday && 'bg-orange-500 text-white font-bold',
                    hasSnapshot && 'underline cursor-pointer',
                  )}
                >
                  {date.getDate()}
                </div>
              );
              return hasSnapshot ? (
                <Link
                  key={iso}
                  href={`/view/${ctx.viewId}/history/${iso}`}
                  aria-label={`View snapshot for ${iso}`}
                >
                  {day}
                </Link>
              ) : (
                <div key={iso}>{day}</div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
