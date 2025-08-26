import Link from 'next/link';

export default function OverviewPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Progress Overview</h1>
      <ul className="space-y-2">
        <li>
          <Link
            href="/progress/overview/daily"
            className="text-orange-500 underline"
          >
            Daily
          </Link>
        </li>
        <li>
          <Link
            href="/progress/overview/weekly"
            className="text-orange-500 underline"
          >
            Weekly
          </Link>
        </li>
        <li>
          <Link
            href="/progress/overview/monthly"
            className="text-orange-500 underline"
          >
            Monthly
          </Link>
        </li>
        <li>
          <Link
            href="/progress/overview/yearly"
            className="text-orange-500 underline"
          >
            Yearly
          </Link>
        </li>
      </ul>
    </main>
  );
}
