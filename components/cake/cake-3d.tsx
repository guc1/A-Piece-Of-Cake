'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { slices } from './slices';

interface Cake3DProps {
  activeSlug: string | null;
  hoveredSlug: string | null;
  setHoveredSlug: (slug: string | null) => void;
  userId: string | number;
}

export function Cake3D({
  activeSlug,
  hoveredSlug,
  setHoveredSlug,
  userId,
}: Cake3DProps) {
  const router = useRouter();
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

  const baseSize = 256; // px
  const cakeScale = 1.3;
  const radius = baseSize / 2;
  const leftNudge = radius * 0.1;
  const labelFont = Math.min(22, Math.max(14, radius * 0.18));
  const topOffset = baseSize * 0.06;

  const idx = hoveredSlug
    ? slices.findIndex((s) => s.slug === hoveredSlug)
    : -1;
  const mid = idx >= 0 ? idx * 60 + 30 : 0;
  const rad = (mid * Math.PI) / 180;
  const x = hoveredSlug ? Math.cos(rad) * radius * 0.96 : 0;
  const y = hoveredSlug ? Math.sin(rad) * radius * 0.96 : 0;

  return (
    <div
      className="relative [perspective:800px]"
      style={{ width: `${baseSize}px`, height: `${baseSize}px` }}
      data-active-slice={activeSlug ?? 'none'}
    >
      <div
        className="absolute left-1/2 top-1/2 h-full w-full [transform-style:preserve-3d]"
        style={{
          transform: `translate(calc(-50% - ${leftNudge}px), -50%) rotateX(-16deg) scale(${cakeScale})`,
        }}
      >
        {slices.map((slice, i) => {
          const rotate = i * 60;
          const mid = rotate + 30;
          const rad = (mid * Math.PI) / 180;
          const isActive = activeSlug === slice.slug;
          const dx = isActive ? Math.cos(rad) * distance : 0;
          const dz = isActive ? Math.sin(rad) * distance : 0;
          const s = isActive ? scaleActive : 1;

          return (
            <button
              key={slice.slug}
              id={`cak3seg-${slice.slug}-${userId}`}
              aria-label={t(`nav.${slice.slug}`)}
              role="link"
              tabIndex={0}
              onClick={() => router.push(slice.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(slice.href);
                }
              }}
              onPointerEnter={() => setHoveredSlug(slice.slug)}
              onPointerLeave={() => setHoveredSlug(null)}
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-transparent"
              style={{
                transform: `translate3d(${dx}px,0,${dz}px) scale(${s})`,
                transition,
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-full -translate-y-full origin-bottom-left rounded-br-[100%] shadow-md"
                style={{
                  transform: `rotate(${rotate}deg)`,
                  backgroundColor: slice.color,
                }}
              />
            </button>
          );
        })}
      </div>
      <span
        id={`cak3lbl-${hoveredSlug ?? 'none'}-${userId}`}
        className="pointer-events-none absolute whitespace-nowrap font-normal text-[var(--text)] [text-shadow:0_0_1px_rgba(0,0,0,0.4)]"
        style={{
          fontSize: `${labelFont}px`,
          left: `calc(50% + ${x - leftNudge}px)`,
          top: `calc(50% + ${y - topOffset}px)`,
          transform: `translate(-50%, -50%) scale(${hoveredSlug ? 1 : 0.96})`,
          opacity: hoveredSlug ? 1 : 0,
          transition: 'opacity 120ms ease, transform 120ms ease',
          transitionDelay: hoveredSlug ? '80ms' : '0ms',
        }}
      >
        {hoveredSlug ? t(`nav.${hoveredSlug}`) : ''}
      </span>
    </div>
  );
}
