'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { slices } from './slices';
import { Cake3D } from './cake-3d';

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = Math.abs(endAngle - startAngle) <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function TitleArc({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dim, setDim] = useState({ w: 0, r: 0 });
  const [mounted, setMounted] = useState(reduced);

  useEffect(() => {
    const update = () => {
      const w = svgRef.current?.parentElement?.offsetWidth ?? 0;
      const r = Math.min(w * 0.34, 360);
      setDim({ w, r });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (reduced) {
      setMounted(true);
      return;
    }
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  const { w, r } = dim;
  const cx = w / 2;
  const cy = r;
  const d = describeArc(cx, cy, r, 200, -20);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${cy}`}
      className={`h-full w-full ${
        reduced ? '' : 'transition-opacity duration-200'
      } ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      <path id="cak3titlePath" d={d} fill="none" />
      <text
        id="cak3titleArc"
        className="fill-[var(--text)] tracking-[0.02em]"
      >
        <textPath href="#cak3titlePath" startOffset="50%" textAnchor="middle">
          A Piece Of Cake
        </textPath>
      </text>
    </svg>
  );
}

export function CakeNavigation() {
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [offsetVh, setOffsetVh] = useState(-8);
  const [reduced, setReduced] = useState(false);
  const userId = '42';

  useEffect(() => {
    const computeOffset = () => {
      const vh = window.innerHeight;
      let val = -8;
      if (vh < 720) val = -6;
      else if (vh >= 900) val = -10;
      setOffsetVh(val);
    };
    computeOffset();
    window.addEventListener('resize', computeOffset);
    return () => window.removeEventListener('resize', computeOffset);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(media.matches);
    setReduced(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  return (
    <div
      className="grid w-full justify-items-center"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      <div
        className="grid w-full place-items-center"
        style={{ height: 'clamp(72px,12vh,144px)' }}
      >
        <TitleArc reduced={reduced} />
      </div>
      <div
        className="grid w-full place-items-center"
        style={{
          height: 'clamp(420px,54vh,720px)',
          transform: `translateY(${offsetVh}vh)`,
        }}
      >
        <Cake3D
          activeSlug={activeSlug}
          hoveredSlug={hoveredSlug}
          setHoveredSlug={setHoveredSlug}
          userId={userId}
        />
      </div>
      <div className="grid w-full place-items-center">
        <nav
          className="grid grid-cols-2 place-items-center gap-3 sm:grid-cols-3 xl:grid-cols-6"
          style={{
            marginTop: 'clamp(32px,6vh,96px)',
          }}
        >
          {slices.map((slice) => {
            const popped = hoveredSlug === slice.slug;
            const scale = popped ? (reduced ? 1.02 : 1.08) : 1;
            const transition = popped
              ? 'transform 140ms ease-out, background-color 140ms ease-out, box-shadow 140ms ease-out, border-color 140ms ease-out'
              : 'transform 160ms ease-in, background-color 160ms ease-in, box-shadow 160ms ease-in, border-color 160ms ease-in';
            return (
              <button
                key={slice.slug}
                id={`n4vbox-${slice.slug}-${userId}`}
                data-popped={popped ? true : undefined}
                aria-label={t(`nav.${slice.slug}`)}
                onClick={() => router.push(slice.href)}
                onMouseEnter={() => {
                  setActiveSlug(slice.slug);
                  setHoveredSlug(slice.slug);
                }}
                onMouseLeave={() => {
                  setActiveSlug(null);
                  setHoveredSlug(null);
                }}
                onFocus={() => {
                  setActiveSlug(slice.slug);
                  setHoveredSlug(slice.slug);
                }}
                onBlur={() => {
                  setActiveSlug(null);
                  setHoveredSlug(null);
                }}
                className={`flex h-[42px] min-w-[168px] items-center justify-center gap-2 rounded border px-4 text-sm font-normal text-[var(--text)] shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                  popped ? 'shadow-md' : ''
                }`}
                style={{
                  transform: `scale(${scale})`,
                  transition,
                  willChange: 'transform',
                  backgroundColor: popped
                    ? 'color-mix(in srgb, var(--surface), white 4%)'
                    : 'var(--surface)',
                  borderColor: popped
                    ? 'hsl(var(--accent) / 0.24)'
                    : undefined,
                }}
              >
                <slice.Icon className="h-4 w-4" />
                {t(`nav.${slice.slug}`)}
              </button>
            );
          })}
        </nav>
      </div>
      <p className="sr-only" aria-live="polite">
        {hoveredSlug ? t(`nav.${hoveredSlug}`) : ''}
      </p>
    </div>
  );
}
