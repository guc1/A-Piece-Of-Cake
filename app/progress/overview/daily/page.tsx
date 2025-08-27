import Link from 'next/link';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listDailyReports } from '@/lib/daily-report-store';

export async function DailyReportsHome({ userId }: { userId: number }) {
  const reports = await listDailyReports(userId);
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Daily Reports</h1>
      <ul className="space-y-4" id={`d41lyrep-list-${userId}`}>
        {reports.map((r) => (
          <li
            key={r.slug}
            className="rounded border p-4"
            id={`d41lyrep-item-${r.slug}-${userId}`}
          >
            <div className="flex items-center justify-between">
              <h2
                className="font-semibold"
                id={`d41lyrep-date-${r.slug}-${userId}`}
              >
                {r.date}
                {r.version > 1 && <span className="ml-1">(v{r.version})</span>}
              </h2>
              <span
                className="font-semibold"
                id={`d41lyrep-score-${r.slug}-${userId}`}
              >
                {r.score}
              </span>
            </div>
            {r.summary && (
              <p
                className="mt-2 whitespace-pre-wrap"
                id={`d41lyrep-sum-${r.slug}-${userId}`}
              >
                {r.summary}
              </p>
            )}
            {r.good.length > 0 && (
              <div className="mt-2" id={`d41lyrep-good-${r.slug}-${userId}`}>
                <h3 className="font-semibold">What went well</h3>
                <ul className="list-disc pl-4">
                  {r.good.map((g, i) => (
                    <li key={i} id={`d41lyrep-good-${i}-${r.slug}-${userId}`}>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.bad.length > 0 && (
              <div className="mt-2" id={`d41lyrep-bad-${r.slug}-${userId}`}>
                <h3 className="font-semibold">What went bad</h3>
                <ul className="list-disc pl-4">
                  {r.bad.map((b, i) => (
                    <li key={i} id={`d41lyrep-bad-${i}-${r.slug}-${userId}`}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.observations.length > 0 && (
              <div className="mt-2" id={`d41lyrep-obs-${r.slug}-${userId}`}>
                <h3 className="font-semibold">Observations</h3>
                <ul className="list-disc pl-4">
                  {r.observations.map((o, i) => (
                    <li key={i} id={`d41lyrep-obs-${i}-${r.slug}-${userId}`}>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href={r.slug}
              className="mt-2 block text-sm text-orange-600 hover:underline"
              id={`d41lyrep-link-${r.slug}-${userId}`}
            >
              View details
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default async function DailyReportsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <DailyReportsHome userId={me.id} />;
}
