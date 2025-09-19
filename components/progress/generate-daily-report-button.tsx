'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useLogs } from '@/components/dev/logs-provider';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ReviewExtraTimeRecord } from '@/lib/review-extra-time-store';

export function GenerateDailyReportButton({
  userId,
  className,
  buttonClassName,
}: {
  userId: number;
  className?: string;
  buttonClassName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const { addLog } = useLogs();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [needsCode, setNeedsCode] = useState(false);
  const [extraTime, setExtraTime] =
    useState<ReviewExtraTimeRecord | null>(null);
  const [reviewDateOverride, setReviewDateOverride] =
    useState<string | null>(null);

  const computeOverride = useCallback(
    (record: ReviewExtraTimeRecord | null) => {
      if (!record || !record.active || !record.frozenDate) return null;
      if (typeof window === 'undefined') return record.frozenDate;
      const key = `daily-report-generated-${userId}-${record.frozenDate}`;
      const generated = window.localStorage.getItem(key) === 'true';
      return generated ? null : record.frozenDate;
    },
    [userId],
  );

  const syncExtraTime = useCallback(async () => {
    try {
      const params = new URLSearchParams({ userId: String(userId) });
      const res = await fetch(
        `/api/account/review-extra-time?${params.toString()}`,
      );
      if (!res.ok) {
        setExtraTime(null);
        setReviewDateOverride(null);
        return null;
      }
      const data = await res.json();
      const record = (data?.reviewExtraTime ?? null) as
        | ReviewExtraTimeRecord
        | null;
      setExtraTime(record);
      setReviewDateOverride(computeOverride(record));
      return record;
    } catch {
      setExtraTime(null);
      setReviewDateOverride(null);
      return null;
    }
  }, [computeOverride, userId]);

  const currentDate = useCallback(() => {
    if (typeof window === 'undefined') {
      const params = new URLSearchParams();
      params.set('userId', String(userId));
      const date =
        reviewDateOverride || new Date().toISOString().slice(0, 10);
      return { date, params };
    }
    const params = new URLSearchParams(window.location.search);
    params.set('userId', String(userId));
    const dateParam = params.get('apoc_date');
    let date = reviewDateOverride || dateParam || '';
    if (!date) {
      const match = document.cookie.match(/apoc_clock=([^;]+)/);
      if (match) {
        const d = new Date(decodeURIComponent(match[1]));
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      if (!date) date = new Date().toISOString().slice(0, 10);
    }
    if (reviewDateOverride) {
      params.set('apoc_date', reviewDateOverride);
    }
    return { date, params };
  }, [reviewDateOverride, userId]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = async () => {
      const record = await syncExtraTime();
      if (cancelled) return;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (
        record?.active &&
        record.expiresAt &&
        typeof window !== 'undefined'
      ) {
        const diff = new Date(record.expiresAt).getTime() - Date.now();
        if (diff > 0) {
          timer = setTimeout(tick, diff + 1000);
        }
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [syncExtraTime]);

  useEffect(() => {
    const { date } = currentDate();
    const key = `daily-report-generated-${userId}-${date}`;
    setNeedsCode(window.localStorage.getItem(key) === 'true');
  }, [currentDate, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      setReviewDateOverride(computeOverride(extraTime));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [computeOverride, extraTime]);

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
        `Daily rapport is created. Your score for today is: ${data.score}`,
      );
      const key = `daily-report-generated-${userId}-${date}`;
      window.localStorage.setItem(key, 'true');
      setNeedsCode(true);
      if (extraTime?.active && extraTime.frozenDate === date) {
        setReviewDateOverride(null);
      }
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
          buttonClassName,
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
