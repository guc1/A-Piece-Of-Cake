'use client';

import { useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';

export function ViewerBar() {
  const router = useRouter();
  const ctx = useViewContext();
  const owner = ctx.ownerId;
  const viewer = ctx.viewerId || 0;
  function exit() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }
  return (
    <div
      id={`v13wbar-${owner}-${viewer}`}
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-40 flex items-center gap-3 rounded-md bg-white/40 p-2 text-sm shadow-sm backdrop-blur-sm dark:bg-black/30"
    >
      <span
        id={`v13wbar-live-${owner}-${viewer}`}
        className="h-2 w-2 rounded-full bg-green-500"
        aria-label="live"
      />
      <span>Viewing (live)</span>
      <span className="px-1">|</span>
      <button
        id={`v13wbar-exit-${owner}-${viewer}`}
        onClick={exit}
        className="underline"
        aria-label="Exit viewing and return to my account"
      >
        Exit
      </button>
    </div>
  );
}

export default ViewerBar;
