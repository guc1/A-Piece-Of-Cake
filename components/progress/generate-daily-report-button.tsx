'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function GenerateDailyReportButton() {
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/progress/daily', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (score !== null) {
    return <p>Daily report is created. Your score for today is: {score}</p>;
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      title="You can only generate once a day"
    >
      {loading ? 'Generating…' : 'Generate daily report'}
    </Button>
  );
}
