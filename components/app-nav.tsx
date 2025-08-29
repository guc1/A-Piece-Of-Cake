'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { hrefFor, type Section } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Clock } from '@/components/clock';
import { cn } from '@/lib/utils';

const labels: Record<Section, string> = {
  cake: 'Cake',
  planning: 'Planning',
  flavors: 'Flavors',
  ingredients: 'Ingredients',
  review: 'Review',
  people: 'People',
  visibility: 'Visibility',
  progress: 'Progress',
};

const underlineColors: Record<Section, string> = {
  cake: 'var(--accent)',
  planning: 'var(--planning)',
  flavors: 'var(--flavors)',
  ingredients: 'var(--ingredients)',
  review: 'var(--review)',
  people: 'var(--people)',
  visibility: 'var(--visibility)',
  progress: 'var(--accent)',
};

export function AppNav() {
  const ctx = useViewContext();
  const pathname = usePathname();
  const router = useRouter();
  const signedIn = ctx.viewerId !== null;
  const sections: Section[] =
    ctx.mode === 'viewer'
      ? [
          'cake',
          'planning',
          'flavors',
          'ingredients',
          'review',
          'people',
          'progress',
        ]
      : ctx.mode === 'historical'
        ? [
            'cake',
            'planning',
            'flavors',
            'ingredients',
            'review',
            'people',
            'visibility',
          ]
        : [
            'cake',
            'planning',
            'flavors',
            'ingredients',
            'review',
            'people',
            'visibility',
            'progress',
          ];

  return (
    <nav className="flex items-center justify-between bg-white p-4 shadow-sm">
      <ul className="flex gap-4 text-neutral-700">
        {sections.map((sec) => {
          const href = hrefFor(sec, ctx);
          const active = pathname === href;
          return (
            <li key={sec}>
              <Link
                href={href}
                className={cn(
                  active && 'font-semibold underline underline-offset-4',
                )}
                style={
                  active
                    ? { textDecorationColor: underlineColors[sec] }
                    : undefined
                }
              >
                {labels[sec]}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-4 text-neutral-700">
        <Clock />
        {signedIn ? (
          <form action="/api/auth/signout" method="post">
            <Button type="submit">Sign out</Button>
          </form>
        ) : (
          <Button type="button" onClick={() => router.push('/signin')}>
            Sign in
          </Button>
        )}
      </div>
    </nav>
  );
}
