'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { slices } from './slices';
import { Cake3D } from './cake-3d';

export function CakeNavigation() {
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const userId = '42';

  return (
    <div
      className="grid w-full place-items-center"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      <div
        className="grid w-full place-items-center"
        style={{
          height: 'clamp(360px,46vh,640px)',
          transform: 'translateY(-10vh)',
        }}
      >
        <Cake3D activeSlug={activeSlug} userId={userId} />
      </div>
      <nav
        className="grid grid-cols-2 justify-center justify-items-center gap-3 sm:grid-cols-3 xl:grid-cols-6"
        style={{
          marginTop: 'clamp(32px,6vh,96px)',
          marginInline: 'auto',
        }}
      >
        {slices.map((slice) => (
          <button
            key={slice.slug}
            id={`n4vbox-${slice.slug}-${userId}`}
            aria-label={t(`nav.${slice.slug}`)}
            onClick={() => router.push(slice.href)}
            onMouseEnter={() => setActiveSlug(slice.slug)}
            onMouseLeave={() => setActiveSlug(null)}
            onFocus={() => setActiveSlug(slice.slug)}
            onBlur={() => setActiveSlug(null)}
            className="flex items-center justify-center gap-2 rounded border bg-[var(--surface)] p-4 text-sm text-[var(--text)] transition-transform duration-200 hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            <slice.Icon className="h-4 w-4" />
            {t(`nav.${slice.slug}`)}
          </button>
        ))}
      </nav>
      <p className="sr-only" aria-live="polite">
        {activeSlug ? `${t(`nav.${activeSlug}`)} slice highlighted` : ''}
      </p>
    </div>
  );
}

