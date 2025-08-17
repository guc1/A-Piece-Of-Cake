'use client';

import React, { CSSProperties, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { slices } from './slices';

interface Cake3DProps {
  activeSlug: string | null;
  hoveredSlug: string | null;
  onHover: (slug: string) => void;
  onLeave: () => void;
  userId: string | number;
}

export function Cake3D({
  activeSlug,
  hoveredSlug,
  onHover,
  onLeave,
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
  const thetaUnit = (Math.PI * 2) / slices.length;
  const gap = 0.025;

  function sectorPath(r: number, start: number, length: number) {
    const x1 = r + r * Math.cos(start);
    const y1 = r + r * Math.sin(start);
    const end = start + length;
    const x2 = r + r * Math.cos(end);
    const y2 = r + r * Math.sin(end);
    return `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  }

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
          const thetaStart = i * thetaUnit + gap / 2;
          const thetaLength = thetaUnit - gap;
          const mid = thetaStart + thetaLength / 2;
          const isActive = activeSlug === slice.slug;
          const dx = isActive ? Math.cos(mid) * distance : 0;
          const dz = isActive ? Math.sin(mid) * distance : 0;
          const s = isActive ? scaleActive : 1;
          const d = sectorPath(radius, thetaStart, thetaLength);
          const clip = `path('${d}')`;

          const style: CSSProperties = {
            transform: `translate3d(${dx}px,0,${dz}px) scale(${s})`,
            transition,
            clipPath: clip,
            WebkitClipPath: clip,
          };

          const segStyle: CSSProperties = {
            backgroundColor: slice.color,
            clipPath: clip,
            WebkitClipPath: clip,
          };

          return (
            <button
              key={slice.slug}
              id={`cak3hit-${slice.slug}-${userId}`}
              aria-label={slice.label}
              role="link"
              tabIndex={0}
              onClick={() => router.push(slice.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(slice.href);
                }
              }}
              onPointerEnter={() => onHover(slice.slug)}
              onPointerLeave={onLeave}
              onFocus={() => onHover(slice.slug)}
              onBlur={onLeave}
              className="absolute inset-0 cursor-pointer bg-transparent"
              style={style}
            >
              <div
                id={`cak3seg-${slice.slug}-${userId}`}
                className="absolute inset-0 pointer-events-none shadow-md"
                style={segStyle}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
