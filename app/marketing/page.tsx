'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useLogs } from '@/components/logs-provider';

export default function MarketingPage() {
  const [clicks, setClicks] = useState(0);
  const { enableLogs } = useLogs();

  function handleSecretClick() {
    setClicks((c) => {
      const next = c + 1;
      if (next === 5) {
        const code = prompt('Enter access code');
        if (code === '123Yergush123') {
          enableLogs();
        }
      }
      return next;
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">
        A Piece{' '}
        <span onClick={handleSecretClick} className="cursor-pointer">
          O
        </span>
        f Cake
      </h1>
      <Link
        href="/signin"
        className="bg-orange-500 text-white px-4 py-2 rounded"
      >
        Enter app
      </Link>
    </main>
  );
}
