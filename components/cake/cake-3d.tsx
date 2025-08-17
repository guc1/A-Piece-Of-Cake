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

export function Cake3D({ activeSlug, hoveredSlug, setHoveredSlug, userId }: Cake3DProps) {
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
  const clampFont = `clamp(14px, ${radius * 0.18}px, 22px)`;

  const [visibleSlug, setVisibleSlug] = useState<string | null>(null);

  useEffect(() => {
    if (hoveredSlug) {
      setVisibleSlug(hoveredSlug);
      return;
    }
    const t = setTimeout(() => setVisibleSlug(null), 160);
    return () => clearTimeout(t);
  }, [hoveredSlug]);

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
              onPointerEnter={() => setHoveredSlug(slice.slug)}
              onPointerLeave={() => setHoveredSlug(null)}
              onClick={() => router.push(slice.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(slice.href);
                }
              }}
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-transparent"
              style={{
                transform: `translate3d(${dx}px,0,${dz}px) scale(${s})`,
                transition,
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-full -translate-y-full origin-bottom-left rounded-br-[100%] shadow-md"
                style={{
                  transform: `rotate(${rotate}deg)` ,
                  backgroundColor: slice.color,
                }}
              />
            </button>
          );
        })}
        {visibleSlug && (
          (() => {
            const idx = slices.findIndex((s) => s.slug === visibleSlug);
            if (idx === -1) return null;
            const thetaStart = (idx * 60 * Math.PI) / 180;
            const thetaLength = (60 * Math.PI) / 180;
            const mid = thetaStart + thetaLength / 2;
            const dirX = Math.cos(mid);
            const dirZ = Math.sin(mid);
            const x = dirX * radius * 0.96;
            const z = dirZ * radius * 0.96;
            const y = -radius * 0.5 - radius * 0.06;
            const visible = hoveredSlug === visibleSlug;
            return (
              <span
                id={`cak3lbl-${visibleSlug}-${userId}`}
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[var(--text)] [text-shadow:0_0_1px_rgba(0,0,0,0.4)]"
                style={{
                  fontSize: clampFont,
                  transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${visible ? 1 : 0.96})`,
                  opacity: visible ? 1 : 0,
                  transition: 'opacity 120ms ease-out, transform 120ms ease-out',
                  transitionDelay: visible ? '80ms' : '0ms',
                }}
              >
                {t(`nav.${visibleSlug}`)}
              </span>
            );
          })()
        )}
      </div>
    </div>
  );
}

