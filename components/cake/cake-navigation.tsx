'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { slices } from './slices';
import { Cake3D } from './cake-3d';

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
        style={{ marginBottom: 'clamp(24px,3vh,36px)' }}
      >
        <h1
          id="cak3titleText"
          className="text-center font-bold tracking-[0.004em]"
          style={{
            color: 'var(--text)',
            fontSize: 'clamp(22px,2.4vw,32px)',
          }}
        >
          A Piece Of Cake
        </h1>
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
                  borderColor: popped ? 'hsl(var(--accent) / 0.24)' : undefined,
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
