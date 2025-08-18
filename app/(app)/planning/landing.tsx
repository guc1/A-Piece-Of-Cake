'use client';

import Link from 'next/link';
import { useViewContext } from '@/lib/view-context';
import { hrefFor } from '@/lib/navigation';

export default function PlanningLanding() {
  const ctx = useViewContext();
  const { ownerId, editable } = ctx;
  const userId = String(ownerId);
  const nextHref = hrefFor('/planning/next', ctx);
  const liveHref = hrefFor('/planning/live', ctx);
  const reviewHref = hrefFor('/planning/review', ctx);
  const common = 'rounded border px-4 py-8 text-center text-lg font-medium';
  return (
    <section
      id={`p1an-landing-${userId}`}
      className="flex flex-col items-center justify-center gap-8 p-8"
    >
      <div className="flex gap-8">
        <Link
          id={`p1an-btn-next-${userId}`}
          href={nextHref}
          className={`${common} ${editable ? '' : 'cursor-not-allowed opacity-50'}`}
          onClick={(e) => {
            if (!editable) e.preventDefault();
          }}
          title={editable ? undefined : 'Read-only in viewing mode'}
          aria-disabled={!editable}
        >
          Planning for Next Day
        </Link>
        <Link
          id={`p1an-btn-live-${userId}`}
          href={liveHref}
          className={`${common} flex items-center justify-center gap-2 ${editable ? '' : 'cursor-not-allowed opacity-50'}`}
          onClick={(e) => {
            if (!editable) e.preventDefault();
          }}
          title={editable ? undefined : 'Read-only in viewing mode'}
          aria-disabled={!editable}
        >
          <span
            className="h-3 w-3 animate-pulse rounded-full bg-red-500"
            aria-hidden="true"
          />
          Live Planning
        </Link>
        <Link
          id={`p1an-btn-review-${userId}`}
          href={reviewHref}
          className={`${common} ${editable ? '' : 'cursor-not-allowed opacity-50'}`}
          onClick={(e) => {
            if (!editable) e.preventDefault();
          }}
          title={editable ? undefined : 'Read-only in viewing mode'}
          aria-disabled={!editable}
        >
          Review Today’s Planning
        </Link>
      </div>
    </section>
  );
}
