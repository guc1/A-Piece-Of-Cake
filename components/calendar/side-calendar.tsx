'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function SideCalendar() {
  const [open, setOpen] = useState(false);
  const today = new Date();

  const start = new Date(today);
  start.setDate(start.getDate() - 30);
  const end = new Date(today);
  end.setDate(end.getDate() + 7);

  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const monthLabel = today.toLocaleDateString(undefined, {
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
          <h2 className="text-center font-semibold">{monthLabel}</h2>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
            {weekDays.map((d) => (
              <div key={d} className="font-medium">
                {d}
              </div>
            ))}
            {days.map((date) => {
              const isToday = date.toDateString() === today.toDateString();
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    'p-1 rounded',
                    isToday && 'bg-orange-500 text-white font-bold',
                  )}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
