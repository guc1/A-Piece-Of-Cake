'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { slices } from './slices';
import { Cake3D } from './cake-3d';

export function CakeNavigation() {
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const userId = '42';

  function handleNavigate(href: string, slug: string) {
    router.push(href);
    setAnnounce(`${t(`nav.${slug}`)} opened`);
  }

  return (
    <section
      className="grid w-full min-h-[calc(100vh-64px)] place-items-center"
      data-active-slice={activeSlug ?? 'none'}
    >
      <div className="grid w-full place-items-center [height:clamp(360px,46vh,640px)] [transform:translateY(-11vh)]">
        <Cake3D
          activeSlug={activeSlug}
          userId={userId}
          onNavigate={handleNavigate}
        />
      </div>
      <nav className="mt-[clamp(32px,6vh,96px)] grid justify-center justify-items-center gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 mx-auto">
        {slices.map((slice) => (
          <button
            key={slice.slug}
            id={`n4vbox-${slice.slug}-${userId}`}
            aria-label={t(`nav.${slice.slug}`)}
            onClick={() => handleNavigate(slice.href, slice.slug)}
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
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}
