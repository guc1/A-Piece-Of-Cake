import Link from 'next/link';

const items = [
  { href: '/progress/overview/daily', label: 'Daily' },
  { href: '/progress/overview/weekly', label: 'Weekly' },
  { href: '/progress/overview/monthly', label: 'Monthly' },
  { href: '/progress/overview/yearly', label: 'Yearly' },
];

export default function ProgressOverviewPage() {
  return (
    <main className="p-6">
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
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
