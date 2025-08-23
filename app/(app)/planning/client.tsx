'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { Button } from '@/components/ui/button';

interface Props {
  userId: string;
  tz: string;
  today: string;
  nextLabel: string;
  liveLabel: string;
  reviewLabel: string;
}

export default function PlanningLanding({
  userId,
  tz,
  today,
  nextLabel,
  liveLabel,
  reviewLabel,
}: Props) {
  const router = useRouter();
  const { editable, viewId, mode, snapshotDate, ownerId, viewerId } =
    useViewContext();
  const tooltip = editable ? undefined : 'Read-only in viewing mode.';

  useEffect(() => {
    const tick = () => {
      fetch(`/api/clock?tz=${encodeURIComponent(tz)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ymd !== today) {
            window.location.reload();
          }
        })
        .catch(() => {});
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [tz, today]);

  function navigate(target: string) {
    if (mode === 'historical') {
      if (viewerId === ownerId) {
        router.push(`/history/self/${snapshotDate}/planning/${target}`);
      } else if (viewId && snapshotDate) {
        router.push(`/history/${viewId}/${snapshotDate}/planning/${target}`);
      }
    } else if (editable) {
      router.push(`/planning/${target}`);
    } else if (viewId) {
      router.push(`/view/${viewId}/planning/${target}`);
    }
  }

  function handleNext() {
    navigate('next');
  }

  function handleLive() {
    navigate('live');
  }

  function handleReview() {
    navigate('review');
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
        Planning for Next Day — {nextLabel}
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
          Live Planning — {liveLabel}
        </Button>
      </div>
      <Button
        id={`p1an-btn-review-${userId}`}
        title={tooltip}
        onClick={handleReview}
      >
        Review Today’s Planning — {reviewLabel}
      </Button>
    </section>
  );
}
