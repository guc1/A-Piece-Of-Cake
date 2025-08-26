'use client';

import Link from 'next/link';
export default function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="mb-4 text-4xl font-bold">A Piece Of Cake</h1>
      <Link
        href="/signin"
        className="rounded bg-orange-500 px-4 py-2 text-white"
      >
        Enter app
      </Link>
    </main>
  );
}
