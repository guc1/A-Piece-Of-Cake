'use client';

import React, { useEffect, useState } from 'react';
import { slices } from './slices';

interface Cake3DProps {
  activeSlug: string | null;
  userId: string | number;
}

export function Cake3D({ activeSlug, userId }: Cake3DProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(media.matches);
    setReduced(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const distance = reduced ? 12 : 40;
  const scaleActive = reduced ? 1.02 : 1.06;
  const transition = reduced
    ? 'transform 200ms ease-out'
    : 'transform 260ms cubic-bezier(0.34,1.56,0.64,1)';

  return (
    <div
      className="relative h-64 w-64 [perspective:800px]"
      data-active-slice={activeSlug ?? 'none'}
    >
      <div
        className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]"
        style={{ transform: 'rotateX(-35deg)' }}
      >
        {slices.map((slice, i) => {
          const rotate = i * 60;
          const mid = rotate + 30;
          const rad = (mid * Math.PI) / 180;
          const isActive = activeSlug === slice.slug;
          const dx = isActive ? Math.cos(rad) * distance : 0;
          const dz = isActive ? Math.sin(rad) * distance : 0;
          const scale = isActive ? scaleActive : 1;

          return (
            <div
              key={slice.slug}
              id={`cak3seg-${slice.slug}-${userId}`}
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate3d(${dx}px,0,${dz}px) scale(${scale})`,
                transition,
              }}
            >
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-full -translate-y-full origin-bottom-left rounded-br-[100%] shadow-md"
                style={{
                  transform: `rotate(${rotate}deg)` ,
                  backgroundColor: slice.color,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

