'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useLogs } from '@/components/dev/logs-provider';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function GenerateDailyReportButton({
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
    const key = `daily-report-generated-${userId}-${date}`;
    setNeedsCode(window.localStorage.getItem(key) === 'true');
  }, [currentDate, userId]);

  const onClick = async () => {
    const { date, params } = currentDate();
    if (needsCode) {
      const code = window
        .prompt('Enter code to generate a new daily report')
        ?.trim();
      if (code !== 'cake2025') return; // incorrect or empty
    }
    setLoading(true);
    const reviewKey = `review-${userId}-${date}`;
    const planKey = `live-plan-${userId}-${date}`;
    let reviews: Record<string, any> = {};
    let plan: Record<string, any> | null = null;
    try {
      const raw = window.localStorage.getItem(reviewKey);
      if (raw) reviews = JSON.parse(raw);
    } catch {
      // ignore
    }
    try {
      const rawPlan = window.localStorage.getItem(planKey);
      if (rawPlan) plan = JSON.parse(rawPlan);
    } catch {
      // ignore
    }
    const ethos = window.localStorage.getItem('review-rational') || '';
    const body = { date, reviews, ethos, plan };
    const url = `/api/progress/daily-report?${params.toString()}`;
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
        `Daily report is created. Your score for today is: ${data.score}`,
      );
      const key = `daily-report-generated-${userId}-${date}`;
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
        {loading ? 'Generating…' : 'Generate daily rapport'}
      </Button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
