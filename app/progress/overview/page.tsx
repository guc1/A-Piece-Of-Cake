'use client';
import Link from 'next/link';
import { useViewContext } from '@/lib/view-context';
import { hrefFor } from '@/lib/navigation';

const items = [
  { href: '/progress/overview/daily', label: 'Daily' },
  { href: '/progress/overview/weekly', label: 'Weekly' },
  { href: '/progress/overview/monthly', label: 'Monthly' },
  { href: '/progress/overview/yearly', label: 'Yearly' },
];

export function ProgressOverviewHome() {
  const ctx = useViewContext();
  return (
    <main className="p-6">
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={hrefFor(i.href, ctx)}
              className="block rounded border p-4 hover:bg-orange-50"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function ProgressOverviewPage() {
  return <ProgressOverviewHome />;
}
