'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GenerateWeeklyReportButton } from './generate-weekly-report-button';
import { GenerateMonthlyReportButton } from './generate-monthly-report-button';
import { GenerateYearlyReportButton } from './generate-yearly-report-button';

export function AdditionalReportButtons({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false);
  const [weekly, setWeekly] = useState({ visible: false, needsCode: false });
  const [monthly, setMonthly] = useState({ visible: false, needsCode: false });
  const [yearly, setYearly] = useState({ visible: false, needsCode: false });

  const anyVisible = weekly.visible || monthly.visible || yearly.visible;
  const anyGreen =
    (weekly.visible && !weekly.needsCode) ||
    (monthly.visible && !monthly.needsCode) ||
    (yearly.visible && !yearly.needsCode);

  if (!anyVisible) return null;

  const colorClass = anyGreen
    ? 'bg-green-500 hover:bg-green-600'
    : 'bg-orange-500 hover:bg-orange-600';
  const bounceClass = anyGreen ? 'animate-bounce' : '';

  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2">
      <Button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'px-3 py-1 text-xs font-bold uppercase text-white',
          colorClass,
          bounceClass,
        )}
      >
        new
      </Button>
      <div
        className={cn(
          'absolute left-full top-1/2 -translate-y-1/2 ml-2 flex flex-col gap-2',
          open ? 'flex' : 'hidden',
        )}
      >
        <GenerateWeeklyReportButton
          userId={userId}
          onStatusChange={setWeekly}
        />
        <GenerateMonthlyReportButton
          userId={userId}
          onStatusChange={setMonthly}
        />
        <GenerateYearlyReportButton
          userId={userId}
          onStatusChange={setYearly}
        />
      </div>
    </div>
  );
}
