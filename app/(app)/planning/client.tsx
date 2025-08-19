'use client';

import { useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { Button } from '@/components/ui/button';

export default function PlanningLanding({
  userId,
  labels,
}: {
  userId: string;
  labels: { next: string; live: string; review: string };
}) {
  const router = useRouter();
  const { editable, viewId } = useViewContext();
  const tooltip = editable ? undefined : 'Read-only in viewing mode.';

  function handleNext() {
    if (editable) router.push('/planning/next');
    else if (viewId) router.push(`/view/${viewId}/planning/next`);
  }

  function handleLive() {
    if (editable) router.push('/planning/live');
    else if (viewId) router.push(`/view/${viewId}/planning/live`);
  }

  function handleReview() {
    if (editable) router.push('/planning/review');
    else if (viewId) router.push(`/view/${viewId}/planning/review`);
  }

  return (
    <section
      id={`p1an-landing-${userId}`}
      className="flex items-center justify-center gap-8 py-10"
    >
      <Button
        id={`p1an-btn-next-${userId}`}
        title={tooltip}
        onClick={handleNext}
      >
        {labels.next}
      </Button>
      <div className="flex items-center">
        <span className="relative mr-2">
          <span className="absolute -left-3 top-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </span>
        <Button
          id={`p1an-btn-live-${userId}`}
          title={tooltip}
          onClick={handleLive}
        >
          {labels.live}
        </Button>
      </div>
      <Button
        id={`p1an-btn-review-${userId}`}
        disabled={!editable}
        title={tooltip}
        onClick={handleReview}
      >
        {labels.review}
      </Button>
    </section>
  );
}
