'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLogs } from '@/components/dev/logs-provider';
import { useRouter } from 'next/navigation';

export function GenerateDailyReportButton({
  userId,
  date,
}: {
  userId: number;
  date: string;
}) {
  const [loading, setLoading] = useState(false);
  const { addLog } = useLogs();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    let reviews: Record<string, any> = {};
    try {
      const raw = window.localStorage.getItem(`review-${userId}-${date}`);
      if (raw) reviews = JSON.parse(raw);
    } catch {
      // ignore malformed data
    }
    const rational = window.localStorage.getItem(`rational-${userId}`) || '';
    const payload = { date, reviews, rational };
    const res = await fetch('/api/progress/daily-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    addLog({ request: JSON.stringify(payload), response: JSON.stringify(data) });
    setLoading(false);
    if (data.error) {
      setMessage(data.error);
    } else {
      setMessage(
        `Daily rapport is created. Your score for today is: ${data.score}`,
      );
      router.refresh();
    }
  };

  if (message) {
    return <p className="mt-4 text-sm">{message}</p>;
  }

  return (
    <Button onClick={onClick} disabled={loading} className="mt-4">
      {loading ? 'Generating…' : 'Generate daily report'}
    </Button>
  );
}
