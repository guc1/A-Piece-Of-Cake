import React from 'react';

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

export const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </IconBase>
);

export const SwirlIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M21 12a9 9 0 1 1-6-8.5" />
  </IconBase>
);

export const FlaskIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M10 2h4" />
    <path d="M12 2v10" />
    <path d="M8.5 11.5h7L19 22H5l3.5-10.5z" />
  </IconBase>
);

export const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />
  </IconBase>
);

export const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <circle cx="9" cy="7" r="4" />
    <circle cx="17" cy="7" r="4" />
    <path d="M2 21a7 7 0 0 1 14 0" />
    <path d="M10 21a7 7 0 0 1 14 0" />
  </IconBase>
);

export const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
);

export interface Slice {
  slug: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

export const slices: Slice[] = [
  { slug: 'planning', href: '/planning', Icon: CalendarIcon, color: 'var(--planning)' },
  { slug: 'flavors', href: '/flavors', Icon: SwirlIcon, color: 'var(--flavors)' },
  { slug: 'ingredients', href: '/ingredients', Icon: FlaskIcon, color: 'var(--ingredients)' },
  { slug: 'review', href: '/review', Icon: StarIcon, color: 'var(--review)' },
  { slug: 'people', href: '/people', Icon: UsersIcon, color: 'var(--people)' },
  { slug: 'visibility', href: '/visibility', Icon: EyeIcon, color: 'var(--visibility)' },
];

