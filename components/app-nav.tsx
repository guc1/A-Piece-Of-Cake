'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useViewContext } from '@/lib/view-context';
import { hrefFor, type Section } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Clock } from '@/components/clock';

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

export function AppNav() {
  const ctx = useViewContext();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
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
    <nav className="flex items-center justify-between border-b bg-[var(--bg)] p-4">
      <ul className="flex gap-4">
        {sections.map((sec) => {
          const href = hrefFor(sec, ctx);
          const active = pathname === href;
          return (
            <li key={sec}>
              <Link href={href} className={active ? 'font-semibold' : ''}>
                {labels[sec]}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-4">
        <Clock />
        {status === 'loading' ? null : session ? (
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
