'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { slices } from './slices';

interface Cake3DProps {
  activeSlug: string | null;
  userId: string | number;
  onNavigate?: (href: string, slug: string) => void;
}

export function Cake3D({ activeSlug, userId, onNavigate }: Cake3DProps) {
  const [reduced, setReduced] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(media.matches);
    setReduced(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const distance = reduced ? 16 : 40;
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
        style={{ transform: 'rotateX(-35deg) scale(1.3)' }}
      >
        {slices.map((slice, i) => {
          const rotate = i * 60;
          const mid = rotate + 30;
          const rad = (mid * Math.PI) / 180;
          const isActive = activeSlug === slice.slug;
          const dx = isActive ? Math.cos(rad) * distance : 0;
          const dz = isActive ? Math.sin(rad) * distance : 0;
          const scale = isActive ? scaleActive : 1;
          const radius = 128;
          const labelRadius = radius * 0.58;
          const labelSize = Math.min(radius * 0.18, 24);
          const lx = Math.cos(rad) * labelRadius;
          const lz = Math.sin(rad) * labelRadius;

          function navigate() {
            if (onNavigate) onNavigate(slice.href, slice.slug);
            else router.push(slice.href);
          }

          return (
            <div
              key={slice.slug}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate3d(${dx}px,0,${dz}px) scale(${scale})`,
                transition,
              }}
            >
              <button
                id={`cak3seg-${slice.slug}-${userId}`}
                aria-label={t(`nav.${slice.slug}`)}
                role="link"
                tabIndex={0}
                onClick={navigate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate();
                  }
                }}
                className="relative block h-1/2 w-1/2 -translate-x-full -translate-y-full origin-bottom-left rounded-br-[100%] shadow-md cursor-pointer"
                style={{
                  transform: `rotate(${rotate}deg) translateZ(1px)`,
                  backgroundColor: slice.color,
                }}
              >
                <span
                  id={`cak3lbl-${slice.slug}-${userId}`}
                  className="pointer-events-none absolute whitespace-nowrap rounded px-1 py-px text-center text-neutral-900 dark:text-neutral-100"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%,-50%) translate3d(${lx}px,-20px,${lz}px) rotateX(35deg)`,
                    fontSize: `${labelSize}px`,
                    backgroundColor: 'rgba(0,0,0,0.12)',
                  }}
                >
                  {t(`nav.${slice.slug}`)}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

