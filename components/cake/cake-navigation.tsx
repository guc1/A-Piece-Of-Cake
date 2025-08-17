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

  const handleSelect = (slug: string) => {
    const slice = slices.find((s) => s.slug === slug);
    if (slice) {
      router.push(slice.href);
      setAnnounce(`${t(`nav.${slug}`)} opened`);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 items-center justify-center">
        <Cake3D
          activeSlug={activeSlug}
          userId={userId}
          onSelect={handleSelect}
        />
      </div>
      <nav className="mt-[clamp(48px,8vh,120px)] grid w-full max-w-md grid-cols-2 gap-2 self-center sm:grid-cols-3">
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
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
