'use client';
import Link from 'next/link';
import { useViewContext } from '@/lib/view-context';
import { hrefFor } from '@/lib/navigation';

export function ProgressHome() {
  const ctx = useViewContext();
  return (
    <main className="p-6 space-x-4">
      <Link
        href={hrefFor('/progress/testchat', ctx)}
        className="bg-orange-500 text-white px-4 py-2 rounded"
      >
        Chat with LLM
      </Link>
      <Link
        href={hrefFor('/progress/overview', ctx)}
        className="bg-orange-500 text-white px-4 py-2 rounded"
      >
        Overview
      </Link>
    </main>
  );
}

export default function ProgressPage() {
  return <ProgressHome />;
}
