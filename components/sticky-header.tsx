'use client';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useViewContext } from '@/lib/view-context';

export default function StickyHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const ctx = useViewContext();
  if (ctx.mode === 'historical') return null;
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white/80 px-4 py-2 backdrop-blur dark:bg-zinc-900/80">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border px-2 py-1 text-sm"
        >
          Back
        </button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      {children}
    </header>
  );
}
