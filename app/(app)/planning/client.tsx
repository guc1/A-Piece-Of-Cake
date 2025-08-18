'use client';

import { useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { Button } from '@/components/ui/button';

export default function PlanningLanding({ userId }: { userId: string }) {
  const router = useRouter();
  const { editable } = useViewContext();
  const tooltip = editable ? undefined : 'Read-only in viewing mode.';
  return (
    <section
      id={`p1an-landing-${userId}`}
      className="flex items-center justify-center gap-8 py-10"
    >
      <Button
        id={`p1an-btn-next-${userId}`}
        disabled={!editable}
        title={tooltip}
        onClick={() => editable && router.push('/planning/next')}
      >
        Planning for Next Day
      </Button>
      <div className="flex items-center">
        <span className="relative mr-2">
          <span className="absolute -left-3 top-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </span>
        <Button
          id={`p1an-btn-live-${userId}`}
          disabled={!editable}
          title={tooltip}
        >
          Live Planning
        </Button>
      </div>
      <Button
        id={`p1an-btn-review-${userId}`}
        disabled={!editable}
        title={tooltip}
      >
        Review Today’s Planning
      </Button>
    </section>
  );
}
