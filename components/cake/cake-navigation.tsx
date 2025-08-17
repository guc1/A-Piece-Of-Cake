'use client';

import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';

function IconBase({ children, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </IconBase>
);

const SwirlIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M21 12a9 9 0 1 1-6-8.5" />
  </IconBase>
);

const FlaskIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M10 2h4" />
    <path d="M12 2v10" />
    <path d="M8.5 11.5h7L19 22H5l3.5-10.5z" />
  </IconBase>
);

const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />
  </IconBase>
);

const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <circle cx="9" cy="7" r="4" />
    <circle cx="17" cy="7" r="4" />
    <path d="M2 21a7 7 0 0 1 14 0" />
    <path d="M10 21a7 7 0 0 1 14 0" />
  </IconBase>
);

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
);

interface Slice {
  key: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

const slices: Slice[] = [
  { key: 'planning', href: '/planning', Icon: CalendarIcon, color: 'var(--planning)' },
  { key: 'flavors', href: '/flavors', Icon: SwirlIcon, color: 'var(--flavors)' },
  { key: 'ingredients', href: '/ingredients', Icon: FlaskIcon, color: 'var(--ingredients)' },
  { key: 'review', href: '/review', Icon: StarIcon, color: 'var(--review)' },
  { key: 'people', href: '/people', Icon: UsersIcon, color: 'var(--people)' },
  { key: 'visibility', href: '/visibility', Icon: EyeIcon, color: 'var(--visibility)' },
];

export function CakeNavigation() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative h-64 w-64 rounded-full bg-[var(--surface)] shadow-md">
        {slices.map((slice, i) => {
          const rotate = i * 60;
          return (
            <button
              key={slice.key}
              aria-label={t(`nav.${slice.key}`)}
              onClick={() => router.push(slice.href)}
              style={{
                transform: `rotate(${rotate}deg)`,
                backgroundColor: slice.color,
              }}
              className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-full -translate-y-full origin-bottom-left rounded-br-[100%] p-2 text-[var(--text)] transition-transform duration-200 ease-out hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              <div
                className="flex h-full w-full flex-col items-center justify-center gap-1"
                style={{ transform: `rotate(-${rotate}deg)` }}
              >
                <slice.Icon className="h-5 w-5" />
                <span className="text-xs">{t(`nav.${slice.key}`)}</span>
              </div>
            </button>
          );
        })}
      </div>
      <nav className="grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-3">
        {slices.map((slice) => (
          <button
            key={slice.key}
            aria-label={t(`nav.${slice.key}`)}
            onClick={() => router.push(slice.href)}
            className="flex items-center justify-center gap-2 rounded border bg-[var(--surface)] p-4 text-sm text-[var(--text)] transition-transform duration-200 hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            <slice.Icon className="h-4 w-4" />
            {t(`nav.${slice.key}`)}
          </button>
        ))}
      </nav>
    </div>
  );
}
