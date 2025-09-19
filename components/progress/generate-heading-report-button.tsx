'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useLogs } from '@/components/dev/logs-provider';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { HeadingReport } from '@/types/report';

export function GenerateHeadingReportButton({
  userId,
  className,
  buttonClassName,
  onGenerated,
}: {
  userId: number;
  className?: string;
  buttonClassName?: string;
  onGenerated?: (r: any) => void;
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
    const key = `heading-report-generated-${userId}-${date}`;
    setNeedsCode(window.localStorage.getItem(key) === 'true');
  }, [currentDate, userId]);

  const onClick = async () => {
    const { date, params } = currentDate();
    if (needsCode) {
      const code = window
        .prompt('Enter code to generate a new overview report')
        ?.trim();
      if (code !== 'cake2025') return;
    }
    setLoading(true);
    const rational = window.localStorage.getItem('review-rational') || '';
    const guilty = window.localStorage.getItem('review-guilty') || '';
    const body = { date, rational, guilty };
    const url = `/api/progress/heading-report?${params.toString()}`;
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
        `Overview rapport is created. Progress score: ${data.scoreProgress}, Probability score: ${data.scoreProbability}`,
      );
      const key = `heading-report-generated-${userId}-${date}`;
      window.localStorage.setItem(key, 'true');
      setNeedsCode(true);
      router.refresh();
      onGenerated?.({
        id: 0,
        userId,
        date,
        version: 1,
        overview: (data.report as HeadingReport | undefined)?.overview ?? '',
        shortTerm:
          (data.report as HeadingReport | undefined)?.shortTerm ?? [],
        longTerm:
          (data.report as HeadingReport | undefined)?.longTerm ?? [],
        feedback:
          (data.report as HeadingReport | undefined)?.feedback ?? [],
        scoreProgress: data.scoreProgress,
        scoreProbability: data.scoreProbability,
        coachTone: (data.toneId as string) ?? 'tone_medium',
        coachToneCustom:
          data.toneId === 'tone_custom'
            ? (data.toneCustom as string) ?? ''
            : '',
        createdAt: new Date().toISOString(),
      } as HeadingReport);
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
        {loading ? 'Generating…' : 'Generate overview rapport'}
      </Button>
      {message && <p className="mt-2 text-sm text-center">{message}</p>}
    </div>
  );
}
