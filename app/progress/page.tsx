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
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={hrefFor('/progress/statistics', ctx)}
          className="rounded bg-orange-500 px-4 py-2 font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600"
        >
          Statistics
        </Link>
        <Link
          href={hrefFor('/progress/overview', ctx)}
          className="rounded bg-orange-500 px-4 py-2 font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600"
        >
          Overview
        </Link>
        <Link
          href={hrefFor('/progress/tracking', ctx)}
          className="rounded bg-orange-500 px-4 py-2 font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600"
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
