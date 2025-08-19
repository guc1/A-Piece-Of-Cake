'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { hrefFor, type Section } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { useApplySiteDate } from '@/lib/use-site-date';

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
  useApplySiteDate();
  const ctx = useViewContext();
  const pathname = usePathname();
  const [now, setNow] = useState(() => {
    const match = document.cookie.match(/(?:^|; )site-date=(\d+)/);
    if (match) {
      const t = Number(match[1]);
      if (!Number.isNaN(t)) return new Date(t);
    }
    return new Date();
  });
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const sections: Section[] =
    ctx.mode === 'viewer'
      ? ['cake', 'planning', 'flavors', 'ingredients', 'review', 'people']
      : ['cake', 'planning', 'flavors', 'ingredients', 'review', 'people', 'visibility'];

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
      <div className="flex items-center gap-4">
        <span className="text-sm">{now.toLocaleString()}</span>
        <form action="/api/auth/signout" method="post">
          <Button type="submit">Sign out</Button>
        </form>
      </div>
    </nav>
  );
}
