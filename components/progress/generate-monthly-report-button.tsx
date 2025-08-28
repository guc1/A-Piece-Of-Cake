'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLogs } from '@/components/dev/logs-provider';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function GenerateMonthlyReportButton({
  userId,
  className,
  onStatusChange,
}: {
  userId: number;
  className?: string;
  onStatusChange?: (status: { visible: boolean; needsCode: boolean }) => void;
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
    const lastDayCurrent = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
    );
    let start: Date;
    let end: Date;
    let show = true;
    if (today.getUTCDate() === lastDayCurrent.getUTCDate()) {
      start = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
      );
      end = lastDayCurrent;
      const dailyKey = `daily-report-generated-${userId}-${date}`;
      show = window.localStorage.getItem(dailyKey) === 'true';
    } else {
      end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
      start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    }
    const startStr = toYMD(start);
    const endStr = toYMD(end);
    setRange({ start: startStr, end: endStr });
    const key = `monthly-report-generated-${userId}-${startStr}`;
    const needs = window.localStorage.getItem(key) === 'true';
    setNeedsCode(needs);
    setVisible(show);
    onStatusChange?.({ visible: show, needsCode: needs });
  }, [currentDate, userId, onStatusChange]);

  if (!visible || !range) return null;

  const onClick = async () => {
    if (needsCode) {
      const code = window
        .prompt('Enter code to generate a new monthly report')
        ?.trim();
      if (code !== 'cake2025') return;
    }
    setLoading(true);
    const { params } = currentDate();
    const ethos = window.localStorage.getItem('review-rational') || '';
    const body = { start: range.start, end: range.end, ethos };
    const url = `/api/progress/monthly-report?${params.toString()}`;
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
        `Monthly rapport is created. Your score for this month is: ${data.score}`,
      );
      const key = `monthly-report-generated-${userId}-${range.start}`;
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
          needsCode
            ? 'bg-orange-500 hover:bg-orange-600'
            : 'bg-green-500 hover:bg-green-600',
        )}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {loading
          ? 'Generating…'
          : `Generate monthly rapport for ${range.start} - ${range.end}`}
      </Button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
