'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function NavBar() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const q = view ? `?view=${view}` : '';
  return (
    <nav className="flex items-center justify-between border-b p-4">
      <ul className="flex gap-4">
        <li>
          <Link href={`/${q}`}>Cake</Link>
        </li>
        <li>
          <Link href={`/planning${q}`}>Planning</Link>
        </li>
        <li>
          <Link href={`/flavors${q}`}>Flavors</Link>
        </li>
        <li>
          <Link href={`/ingredients${q}`}>Ingredients</Link>
        </li>
        <li>
          <Link href={`/review${q}`}>Review</Link>
        </li>
        <li>
          <Link href={`/people${q}`}>People</Link>
        </li>
        <li>
          <Link href={`/visibility${q}`}>Visibility</Link>
        </li>
      </ul>
      <form action="/api/auth/signout" method="post">
        <Button type="submit">Sign out</Button>
      </form>
    </nav>
  );
}
