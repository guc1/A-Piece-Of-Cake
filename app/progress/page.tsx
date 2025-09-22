'use client';
import Link from 'next/link';
import BackButton from '@/components/back-button';
import { useViewContext } from '@/lib/view-context';
import { hrefFor } from '@/lib/navigation';

export function ProgressHome() {
  const ctx = useViewContext();
  return (
    <main className="p-6">
      <BackButton href={hrefFor('/', ctx)} />
      <div className="space-x-4">
        <Link
          href={hrefFor('/progress/statistics', ctx)}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Statistics
        </Link>
        <Link
          href={hrefFor('/progress/overview', ctx)}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Overview
        </Link>
        <Link
          href={hrefFor('/progress/tracking', ctx)}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Tracking
        </Link>
      </div>
    </main>
  );
}

export default function ProgressPage() {
  return <ProgressHome />;
}
