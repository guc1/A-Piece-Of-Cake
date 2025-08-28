'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export function RangeNav({
  prev,
  next,
  prevLabel,
  nextLabel,
}: {
  prev?: string;
  next?: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  function nav(target?: string) {
    if (!target) return;
    const params = new URLSearchParams(search.toString());
    params.set('start', target);
    router.push('?' + params.toString());
  }
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={!prev}
        onClick={() => nav(prev)}
        className="rounded border px-2 py-1 text-sm disabled:opacity-50"
      >
        {prevLabel}
      </button>
      <button
        type="button"
        disabled={!next}
        onClick={() => nav(next)}
        className="rounded border px-2 py-1 text-sm disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );
}
