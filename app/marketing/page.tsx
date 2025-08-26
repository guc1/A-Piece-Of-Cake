'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useLogs } from '@/components/dev/logs-provider';

export default function MarketingPage() {
  const { unlock } = useLogs();
  const clicks = useRef(0);

  const handleClick = () => {
    clicks.current += 1;
    if (clicks.current >= 5) {
      const code = window.prompt('Enter code');
      if (code === '123Yergush123') {
        unlock();
      }
      clicks.current = 0;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">
        A Piece{' '}
        <span
          onClick={handleClick}
          className="cursor-pointer text-orange-500 select-none"
        >
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
