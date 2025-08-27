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
      <ul className="space-y-4">
        {reports.map((r) => (
          <li
            key={r.slug}
            id={`d41lyr3p-${r.slug}-${me.id}`}
            className="rounded border p-4"
          >
            <div className="flex items-center justify-between">
              <h2
                id={`d41lyr3p-title-${r.slug}-${me.id}`}
                className="font-semibold"
              >
                Daily report {r.date}
                {r.version > 1 && <span className="ml-1">V{r.version}</span>}
              </h2>
              <span
                id={`d41lyr3p-score-${r.slug}-${me.id}`}
                className="font-semibold"
              >
                {r.score}
              </span>
            </div>
            {r.summary && (
              <p
                id={`d41lyr3p-sum-${r.slug}-${me.id}`}
                className="mt-2 whitespace-pre-wrap"
              >
                {r.summary}
              </p>
            )}
            {r.good.length > 0 && (
              <div id={`d41lyr3p-good-${r.slug}-${me.id}`} className="mt-2">
                <h3 className="font-semibold">What went well</h3>
                <ul className="list-disc pl-4">
                  {r.good.map((g, i) => (
                    <li key={i} id={`d41lyr3p-good${i}-${r.slug}-${me.id}`}>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.bad.length > 0 && (
              <div id={`d41lyr3p-bad-${r.slug}-${me.id}`} className="mt-2">
                <h3 className="font-semibold">What went bad</h3>
                <ul className="list-disc pl-4">
                  {r.bad.map((b, i) => (
                    <li key={i} id={`d41lyr3p-bad${i}-${r.slug}-${me.id}`}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.observations.length > 0 && (
              <div id={`d41lyr3p-obs-${r.slug}-${me.id}`} className="mt-2">
                <h3 className="font-semibold">Observations</h3>
                <ul className="list-disc pl-4">
                  {r.observations.map((o, i) => (
                    <li key={i} id={`d41lyr3p-obs${i}-${r.slug}-${me.id}`}>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href={`/progress/overview/daily/${r.slug}`}
              className="mt-2 block text-sm text-orange-600 hover:underline"
              id={`d41lyr3p-view-${r.slug}-${me.id}`}
            >
              View details
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
