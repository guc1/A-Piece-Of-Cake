'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { hrefFor, type Section } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Clock } from '@/components/clock';
import { cn } from '@/lib/utils';

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

type ExtensionState = {
  visible: boolean;
  mode?: 'current' | 'historical';
  extension?: {
    reason: string;
    targetDate: string;
    expiresAt: string;
    createdAt: string;
    active: boolean;
  };
};

export function AppNav() {
  const ctx = useViewContext();
  const pathname = usePathname();
  const router = useRouter();
  const signedIn = ctx.viewerId !== null;
  const [extension, setExtension] = useState<ExtensionState>({ visible: false });
  const [showReason, setShowReason] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        params.set('userId', String(ctx.ownerId));
        if (ctx.mode === 'historical' && ctx.snapshotDate) {
          params.set('date', ctx.snapshotDate);
        }
        const qs = params.toString();
        const res = await fetch(
          `/api/review-extension${qs ? `?${qs}` : ''}`,
          { cache: 'no-store' },
        );
        if (!res.ok) {
          if (!cancelled) {
            setExtension({ visible: false });
            setShowReason(false);
          }
          return;
        }
        const data = (await res.json()) as ExtensionState;
        if (!cancelled) {
          setExtension(data);
          if (!data?.visible) setShowReason(false);
        }
      } catch {
        if (!cancelled) {
          setExtension((prev) => (prev?.visible ? prev : { visible: false }));
        }
      }
    }
    load();
    const id = window.setInterval(load, 60_000);
    const handler = () => load();
    window.addEventListener('review-extension:changed', handler);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener('review-extension:changed', handler);
    };
  }, [ctx.ownerId, ctx.mode, ctx.snapshotDate]);

  const ext = extension.visible ? extension.extension : null;
  const targetLabel = ext
    ? new Date(`${ext.targetDate}T00:00:00Z`).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      })
    : '';
  const expiresLabel =
    ext && extension.mode === 'current'
      ? new Date(ext.expiresAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : '';

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
        {ext && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowReason((v) => !v)}
              aria-expanded={showReason}
              className="rounded-full bg-[var(--review)] px-3 py-1 text-xs font-semibold text-white shadow transition hover:opacity-90"
            >
              12H extra to review
            </button>
            {showReason && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-[var(--review)]/40 bg-white p-3 text-sm shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--review)]">
                  Frozen on {targetLabel}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-neutral-700">
                  {ext.reason}
                </p>
                <p className="mt-3 text-xs text-neutral-500">
                  {extension.mode === 'historical'
                    ? 'Historical snapshot — this reason was recorded for that day.'
                    : `Extra time active until ${expiresLabel}.`}
                </p>
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
