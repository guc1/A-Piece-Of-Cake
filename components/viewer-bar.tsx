'use client';
import { useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';

export function ViewerBar() {
  const router = useRouter();
  const ctx = useViewContext();
  if (ctx.mode === 'owner') return null;
  const label =
    ctx.mode === 'historical'
      ? `Snapshot ${ctx.snapshotDate}`
      : 'Viewing (live)';
  const exitPath =
    ctx.mode === 'viewer'
      ? '/'
      : ctx.viewerId === ctx.ownerId
        ? '/'
        : `/view/${ctx.viewId}`;
  return (
    <div
      id={`v13wbar-${ctx.ownerId}-${ctx.viewerId || 0}`}
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-40 rounded-md bg-black/30 px-3 py-2 text-sm text-white backdrop-blur-sm shadow-sm dark:bg-white/40 dark:text-black"
    >
      <span className="flex items-center gap-2">
        {label}
        {ctx.mode === 'viewer' && (
          <span
            id={`v13wbar-live-${ctx.ownerId}-${ctx.viewerId || 0}`}
            aria-label="live"
            className="h-2 w-2 rounded-full bg-green-500"
          />
        )}
        &bull;
        <button
          id={`v13wbar-exit-${ctx.ownerId}-${ctx.viewerId || 0}`}
          onClick={() => {
            if (ctx.mode === 'viewer') {
              const prev = document.referrer;
              if (prev && !prev.includes('/view/')) router.back();
              else router.push('/');
            } else {
              router.push(exitPath);
            }
          }}
          aria-label="Exit viewing and return to my account"
          className="underline"
        >
          Exit
        </button>
      </span>
    </div>
  );
}
