'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppNav() {
  const pathname = usePathname();
  const match = pathname.match(/^\/view\/([^/]+)/);
  const base = match ? `/view/${match[1]}` : '';
  const links = [
    { label: 'Cake', href: base || '/' },
    { label: 'Planning', href: base ? `${base}/planning` : '/planning' },
    { label: 'Flavors', href: base ? `${base}/flavors` : '/flavors' },
    { label: 'Ingredients', href: base ? `${base}/ingredients` : '/ingredients' },
    { label: 'Review', href: base ? `${base}/review` : '/review' },
    { label: 'People', href: base ? `${base}/people` : '/people' },
    { label: 'Visibility', href: base ? `${base}/visibility` : '/visibility' },
  ];
  return (
    <nav className="flex items-center justify-between border-b p-4">
      <ul className="flex gap-4">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className={pathname === l.href ? 'font-bold' : ''}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <form action="/api/auth/signout" method="post">
        <button type="submit" className="underline">
          Sign out
        </button>
      </form>
    </nav>
  );
}

export default AppNav;
