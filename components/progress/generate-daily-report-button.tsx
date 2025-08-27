'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLogs } from '@/components/dev/logs-provider';
import { useRouter } from 'next/navigation';

export function GenerateDailyReportButton({
  userId,
}: {
  userId: number;
}) {
  const [loading, setLoading] = useState(false);
  const { addLog } = useLogs();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    const params = new URLSearchParams(window.location.search);
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
    const url = `/api/progress/daily-report${
      params.toString() ? `?${params.toString()}` : ''
    }`;
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
      router.refresh();
    }
  };

  if (message) {
    return <p className="mt-4 text-sm">{message}</p>;
  }

  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className="mt-4 flex items-center gap-2"
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {loading ? 'Generating…' : 'Generate daily report'}
    </Button>
  );
}
