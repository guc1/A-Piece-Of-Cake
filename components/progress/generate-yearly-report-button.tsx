'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLogs } from '@/components/dev/logs-provider';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function GenerateYearlyReportButton({
  userId,
  className,
}: {
  userId: number;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const { addLog } = useLogs();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [needsCode, setNeedsCode] = useState(false);
  const [visible, setVisible] = useState(false);
  const [range, setRange] = useState<{ start: string; end: string } | null>(
    null,
  );

  const currentDate = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('userId', String(userId));
    const dateParam = params.get('apoc_date');
    let date = dateParam || '';
    if (!date) {
      const match = document.cookie.match(/apoc_clock=([^;]+)/);
      if (match) {
        const d = new Date(decodeURIComponent(match[1]));
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      if (!date) date = new Date().toISOString().slice(0, 10);
    }
    return { date, params };
  }, [userId]);

  useEffect(() => {
    const { date } = currentDate();
    const today = new Date(date);
    let year = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const day = today.getUTCDate();
    let show = false;
    if (month === 11 && day === 31) {
      const decStart = `${year}-12-01`;
      const dailyKey = `daily-report-generated-${userId}-${date}`;
      const monthlyKey = `monthly-report-generated-${userId}-${decStart}`;
      show =
        window.localStorage.getItem(dailyKey) === 'true' &&
        window.localStorage.getItem(monthlyKey) === 'true';
    } else if (month === 0) {
      year = year - 1;
      const decStart = `${year}-12-01`;
      const monthlyKey = `monthly-report-generated-${userId}-${decStart}`;
      show = window.localStorage.getItem(monthlyKey) === 'true';
    }
    const startStr = `${year}-01-01`;
    const endStr = `${year}-12-31`;
    setRange({ start: startStr, end: endStr });
    const key = `yearly-report-generated-${userId}-${startStr}`;
    setNeedsCode(window.localStorage.getItem(key) === 'true');
    setVisible(show);
  }, [currentDate, userId]);

  if (!visible || !range) return null;

  const onClick = async () => {
    if (needsCode) {
      const code = window
        .prompt('Enter code to generate a new yearly report')
        ?.trim();
      if (code !== 'cake2025') return;
    }
    setLoading(true);
    const { params } = currentDate();
    const ethos = window.localStorage.getItem('review-rational') || '';
    const body = { start: range.start, end: range.end, ethos };
    const url = `/api/progress/yearly-report?${params.toString()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    addLog({
      request: data.context || JSON.stringify(body),
      response: JSON.stringify(data.report ?? data),
    });
    setLoading(false);
    if (data.error) {
      setMessage(data.error);
    } else {
      setMessage(
        `Yearly rapport is created. Your score for this year is: ${data.score}`,
      );
      const key = `yearly-report-generated-${userId}-${range.start}`;
      window.localStorage.setItem(key, 'true');
      setNeedsCode(true);
      router.refresh();
    }
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <Button
        onClick={onClick}
        disabled={loading}
        className={cn(
          'flex items-center gap-2 text-white',
          needsCode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600',
        )}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {loading
          ? 'Generating…'
          : `Generate yearly rapport for ${range.start} - ${range.end}`}
      </Button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
