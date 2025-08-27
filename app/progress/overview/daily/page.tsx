import Link from 'next/link';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listDailyReports } from '@/lib/daily-report-store';

export default async function DailyReportsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  const reports = await listDailyReports(me.id);
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Daily Reports</h1>
      <ul className="space-y-4" id={`d41lyrep-list-${me.id}`}>
        {reports.map((r) => (
          <li
            key={r.slug}
            className="rounded border p-4"
            id={`d41lyrep-item-${r.slug}-${me.id}`}
          >
            <div className="flex items-center justify-between">
              <h2
                className="font-semibold"
                id={`d41lyrep-date-${r.slug}-${me.id}`}
              >
                {r.date}
                {r.version > 1 && <span className="ml-1">(v{r.version})</span>}
              </h2>
              <span
                className="font-semibold"
                id={`d41lyrep-score-${r.slug}-${me.id}`}
              >
                {r.score}
              </span>
            </div>
            {r.summary && (
              <p
                className="mt-2 whitespace-pre-wrap"
                id={`d41lyrep-sum-${r.slug}-${me.id}`}
              >
                {r.summary}
              </p>
            )}
            {r.good.length > 0 && (
              <div className="mt-2" id={`d41lyrep-good-${r.slug}-${me.id}`}>
                <h3 className="font-semibold">What went well</h3>
                <ul className="list-disc pl-4">
                  {r.good.map((g, i) => (
                    <li key={i} id={`d41lyrep-good-${i}-${r.slug}-${me.id}`}>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.bad.length > 0 && (
              <div className="mt-2" id={`d41lyrep-bad-${r.slug}-${me.id}`}>
                <h3 className="font-semibold">What went bad</h3>
                <ul className="list-disc pl-4">
                  {r.bad.map((b, i) => (
                    <li key={i} id={`d41lyrep-bad-${i}-${r.slug}-${me.id}`}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.observations.length > 0 && (
              <div className="mt-2" id={`d41lyrep-obs-${r.slug}-${me.id}`}>
                <h3 className="font-semibold">Observations</h3>
                <ul className="list-disc pl-4">
                  {r.observations.map((o, i) => (
                    <li key={i} id={`d41lyrep-obs-${i}-${r.slug}-${me.id}`}>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href={`/progress/overview/daily/${r.slug}`}
              className="mt-2 block text-sm text-orange-600 hover:underline"
              id={`d41lyrep-link-${r.slug}-${me.id}`}
            >
              View details
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
