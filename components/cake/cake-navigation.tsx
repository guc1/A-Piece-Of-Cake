'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { slices } from './slices';
import { Cake3D } from './cake-3d';
import { SettingsButton } from './settings-button';

interface CakeNavigationProps {
  userId?: string | number;
  readOnly?: boolean;
}

export function CakeNavigation({
  userId = 'self',
  readOnly = false,
}: CakeNavigationProps) {
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [offsetVh, setOffsetVh] = useState(-8);
  const [boxesOffsetVh, setBoxesOffsetVh] = useState(-6);
  const [reduced, setReduced] = useState(false);
  const clearTimer = useRef<NodeJS.Timeout | null>(null);

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
    const computeBoxesOffset = () => {
      const vh = window.innerHeight;
      let val = -6;
      if (vh < 640) val = -4;
      else if (vh >= 900) val = -8;
      setBoxesOffsetVh(val);
    };
    computeBoxesOffset();
    window.addEventListener('resize', computeBoxesOffset);
    return () => window.removeEventListener('resize', computeBoxesOffset);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(media.matches);
    setReduced(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  function handleEnter(slug: string) {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
    setActiveSlug(slug);
    setHoveredSlug(slug);
  }

  function handleLeave() {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
    clearTimer.current = setTimeout(() => {
      setActiveSlug(null);
      setHoveredSlug(null);
    }, 80);
  }

  const hoveredLabel = hoveredSlug
    ? (slices.find((s) => s.slug === hoveredSlug)?.label ?? '')
    : '';

  return (
    <div
      className="relative grid w-full justify-items-center"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      {!readOnly && <SettingsButton />}
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
          onHover={handleEnter}
          onLeave={handleLeave}
          userId={userId}
        />
      </div>
      <div className="grid w-full place-items-center">
        <nav
          className="grid grid-cols-2 place-items-center gap-3 sm:grid-cols-3 xl:grid-cols-6"
          style={{
            marginTop: 'clamp(32px,6vh,96px)',
            transform: `translateY(${boxesOffsetVh}vh)`,
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
                aria-label={slice.label}
                onClick={() => {
                  const target =
                    userId === 'self'
                      ? slice.href
                      : `${slice.href}?view=${userId}`;
                  router.push(target);
                }}
                onMouseEnter={() => handleEnter(slice.slug)}
                onMouseLeave={handleLeave}
                onFocus={() => handleEnter(slice.slug)}
                onBlur={handleLeave}
                className={`flex h-[42px] min-w-[168px] items-center justify-center gap-2 rounded border px-4 text-[0.95rem] font-normal text-[var(--text)] shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
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
                {slice.label}
              </button>
            );
          })}
        </nav>
      </div>
      <p className="sr-only" aria-live="polite">
        {hoveredLabel}
      </p>
    </div>
  );
}
