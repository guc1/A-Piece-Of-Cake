'use client';

import React, { useEffect, useState } from 'react';
import { t } from '@/lib/i18n';
import { slices } from './slices';

interface Cake3DProps {
  activeSlug: string | null;
  userId: string | number;
  onSliceClick?: (slug: string) => void;
}

export function Cake3D({ activeSlug, userId, onSliceClick }: Cake3DProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(media.matches);
    setReduced(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const distance = reduced ? 15 : 50;
  const scaleActive = reduced ? 1.02 : 1.06;
  const transition = reduced
    ? 'transform 200ms ease-out'
    : 'transform 260ms cubic-bezier(0.34,1.56,0.64,1)';

  const size = 320; // px
  const radius = size / 2;
  const labelOffset = radius * 0.72;
  const fontSize = radius * 0.18;
  const maxLabelWidth = radius * 0.8;

  return (
    <div
      className="relative h-80 w-80 [perspective:800px]"
      data-active-slice={activeSlug ?? 'none'}
    >
      <div
        className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]"
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
          const label = t(`nav.${slice.slug}`);

          return (
            <div
              key={slice.slug}
              id={`cak3seg-${slice.slug}-${userId}`}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate3d(${dx}px,0,${dz}px) scale(${scale})`,
                transition,
              }}
            >
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-full -translate-y-full origin-bottom-left rounded-br-[100%] shadow-lg"
                style={{
                  transform: `rotate(${rotate}deg)`,
                  backgroundColor: slice.color,
                }}
              />
              <button
                className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-full -translate-y-full origin-bottom-left rounded-br-[100%] bg-transparent cursor-pointer focus:outline-none"
                style={{ transform: `rotate(${rotate}deg)` }}
                aria-label={label}
                onClick={() => onSliceClick?.(slice.slug)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSliceClick?.(slice.slug);
                  }
                }}
              />
              <span
                id={`cak3lbl-${slice.slug}-${userId}`}
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-center font-medium text-[var(--text)]"
                style={{
                  transform: `rotate(${mid}deg) translateY(-${labelOffset}px) rotate(${-mid}deg)`,
                  fontSize: `${fontSize}px`,
                  maxWidth: `${maxLabelWidth}px`,
                  lineHeight: '1.1',
                  textShadow: '0 0 2px rgba(0,0,0,0.4)',
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

