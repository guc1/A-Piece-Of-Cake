'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { hrefFor, type Section } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Clock } from '@/components/clock';
import { cn } from '@/lib/utils';
import type { ReviewExtraTimeRecord } from '@/lib/review-extra-time-store';

const labels: Record<Section, string> = {
  cake: 'Cake',
  planning: 'Planning',
  flavors: 'Flavors',
  ingredients: 'Ingredients',
  review: 'Review',
  people: 'People',
  visibility: 'Visibility',
  progress: 'Progress',
};

const underlineColors: Record<Section, string> = {
  cake: 'var(--accent)',
  planning: 'var(--planning)',
  flavors: 'var(--flavors)',
  ingredients: 'var(--ingredients)',
  review: 'var(--review)',
  people: 'var(--people)',
  visibility: 'var(--visibility)',
  progress: 'var(--accent)',
};

export function AppNav() {
  const ctx = useViewContext();
  const pathname = usePathname();
  const router = useRouter();
  const signedIn = ctx.viewerId !== null;
  const [extraTime, setExtraTime] = useState<ReviewExtraTimeRecord | null>(null);
  const [showReason, setShowReason] = useState(false);
  useEffect(() => {
    if (!ctx.ownerId) {
      setExtraTime(null);
      return;
    }
    const params = new URLSearchParams({ userId: String(ctx.ownerId) });
    if (ctx.mode === 'historical' && ctx.snapshotDate) {
      params.set('snapshotDate', ctx.snapshotDate);
    }
    let cancelled = false;
    fetch(`/api/account/review-extra-time?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setExtraTime(data?.reviewExtraTime ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setExtraTime(null);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx.ownerId, ctx.mode, ctx.snapshotDate]);

  useEffect(() => {
    if (!extraTime) setShowReason(false);
  }, [extraTime]);
  const sections: Section[] =
    ctx.mode === 'viewer'
      ? [
          'cake',
          'planning',
          'flavors',
          'ingredients',
          'review',
          'people',
          'progress',
        ]
      : ctx.mode === 'historical'
        ? [
            'cake',
            'planning',
            'flavors',
            'ingredients',
            'review',
            'people',
            'visibility',
          ]
        : [
            'cake',
            'planning',
            'flavors',
            'ingredients',
            'review',
            'people',
            'visibility',
            'progress',
          ];

  return (
    <nav className="flex items-center justify-between bg-white p-4 shadow-sm">
      <ul className="flex gap-4 text-neutral-700">
        {sections.map((sec) => {
          const href = hrefFor(sec, ctx);
          const active = pathname === href;
          return (
            <li key={sec}>
              <Link
                href={href}
                className={cn(
                  active && 'font-semibold underline underline-offset-4',
                )}
                style={
                  active
                    ? { textDecorationColor: underlineColors[sec] }
                    : undefined
                }
              >
                {labels[sec]}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-4 text-neutral-700">
        {extraTime && (
          <div className="relative">
            <button
              type="button"
              id={`nav-extra-${ctx.ownerId}-${ctx.viewerId ?? 'guest'}`}
              onClick={() => setShowReason((prev) => !prev)}
              aria-expanded={showReason}
              aria-controls="nav-extra-reason"
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-white shadow transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300',
                extraTime.active
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                  : 'bg-gradient-to-r from-zinc-500 to-zinc-400',
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  extraTime.active ? 'bg-green-200' : 'bg-white/70',
                )}
                aria-hidden
              />
              12H extra to review
            </button>
            {showReason && (
              <div
                id="nav-extra-reason"
                role="dialog"
                aria-modal="false"
                className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-orange-100 bg-white p-4 text-sm text-neutral-700 shadow-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-orange-600">
                      Extra review time reason
                    </div>
                    <div className="text-xs text-neutral-500">
                      {extraTime.active ? 'Active now' : 'Historical'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReason(false)}
                    aria-label="Close extra time reason"
                    className="text-neutral-400 transition hover:text-neutral-600"
                  >
                    ×
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed">
                  {extraTime.reason}
                </p>
                {extraTime.frozenDate && (
                  <p className="mt-3 text-xs text-neutral-500">
                    Applies to the review for{' '}
                    {new Date(`${extraTime.frozenDate}T00:00:00`).toLocaleDateString(
                      'en-GB',
                      { dateStyle: 'medium' },
                    )}
                    .
                  </p>
                )}
                {extraTime.expiresAt && (
                  <p className="text-xs text-neutral-500">
                    {extraTime.active ? 'Active until ' : 'Window ended at '}
                    {new Date(extraTime.expiresAt).toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    .
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <Clock />
        {signedIn ? (
          <form action="/api/auth/signout" method="post">
            <Button type="submit">Sign out</Button>
          </form>
        ) : (
          <Button type="button" onClick={() => router.push('/signin')}>
            Sign in
          </Button>
        )}
      </div>
    </nav>
  );
}
