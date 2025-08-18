'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { hrefFor, type Section } from '@/lib/navigation';
import { Button } from '@/components/ui/button';

const labels: Record<Section, string> = {
  cake: 'Cake',
  planning: 'Planning',
  flavors: 'Flavors',
  ingredients: 'Ingredients',
  review: 'Review',
  people: 'People',
  visibility: 'Visibility',
};

export function AppNav() {
  const ctx = useViewContext();
  const pathname = usePathname();
  const sections: Section[] =
    ctx.mode === 'owner'
      ? ['cake', 'planning', 'flavors', 'ingredients', 'review', 'people', 'visibility']
      : ['cake', 'planning', 'flavors', 'ingredients', 'review', 'people'];

  return (
    <nav className="flex items-center justify-between border-b p-4">
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
      <form action="/api/auth/signout" method="post">
        <Button type="submit">Sign out</Button>
      </form>
    </nav>
  );
}
