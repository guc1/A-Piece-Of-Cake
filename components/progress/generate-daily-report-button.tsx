'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLogs } from '@/components/dev/logs-provider';
import { useRouter } from 'next/navigation';

export function GenerateDailyReportButton() {
  const [loading, setLoading] = useState(false);
  const { addLog } = useLogs();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    const res = await fetch('/api/progress/daily-report', { method: 'POST' });
    const data = await res.json();
    addLog({
      request: 'generate daily report',
      response: JSON.stringify(data),
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
      title="You can only generate once per day"
      className="mt-4"
    >
      {loading ? 'Generating…' : 'Generate daily report'}
    </Button>
  );
}
