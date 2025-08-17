'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { slices } from './slices';
import { Cake3D } from './cake-3d';
import { TitleArc } from './title-arc';

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
    handler();
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  return (
    <div
      className="grid w-full justify-items-center"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      {/* Title Row */}
      <div
        className="grid w-full place-items-center"
        style={{ height: 'clamp(72px,12vh,144px)' }}
      >
        <TitleArc reduced={reduced} />
      </div>

      {/* Cake Row */}
      <div
        className="grid w-full place-items-center"
        style={{
          height: 'clamp(420px,54vh,720px)',
          transform: `translateY(${offsetVh}vh)`,
        }}
      >
        <Cake3D
          activeSlug={activeSlug}
          setHoveredSlug={setHoveredSlug}
          userId={userId}
        />
      </div>

      {/* Boxes Row */}
      <div
        className="grid w-full place-items-center"
        style={{ marginTop: 'clamp(32px,6vh,96px)' }}
      >
        <nav
          className="grid grid-cols-2 justify-center justify-items-center gap-3 sm:grid-cols-3 xl:grid-cols-6"
          style={{ marginInline: 'auto' }}
        >
          {slices.map((slice) => {
            const popped = hoveredSlug === slice.slug;
            const scale = popped ? (reduced ? 1.02 : 1.08) : 1;
            const transition = popped
              ? 'transform 140ms ease-out'
              : 'transform 160ms ease-in';
            return (
              <button
                key={slice.slug}
                id={`n4vbox-${slice.slug}-${userId}`}
                data-popped={popped ? 'true' : undefined}
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
                className="flex h-[42px] min-w-[168px] items-center justify-center gap-2 rounded border bg-[var(--surface)] px-4 text-sm font-normal text-[var(--text)] shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                style={{
                  transform: `scale(${scale})`,
                  transition,
                  willChange: 'transform',
                  boxShadow: popped ? '0 4px 6px rgb(0 0 0 / 0.15)' : undefined,
                  borderColor: popped
                    ? 'color-mix(in srgb, var(--accent) 24%, transparent)'
                    : undefined,
                  backgroundColor: popped
                    ? 'color-mix(in srgb, var(--surface) 96%, white)'
                    : undefined,
                  opacity: reduced ? (popped ? 1 : 0.92) : 1,
                }}
              >
                <slice.Icon className="h-4 w-4" />
                {t(`nav.${slice.slug}`)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Screen reader announcement */}
      <p className="sr-only" aria-live="polite">
        {hoveredSlug ? t(`nav.${hoveredSlug}`) : ''}
      </p>
    </div>
  );
}
