import Link from 'next/link';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { getDifficultyLabel } from '@/lib/ai/difficulty';

export async function WeeklyReportsHome({ userId }: { userId: number }) {
  const reports = await listWeeklyReports(userId);
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Weekly Reports</h1>
      <ul className="space-y-4" id={`w33klyrep-list-${userId}`}>
        {reports.map((r) => (
          <li
            key={r.slug}
            className="rounded border p-4"
            id={`w33klyrep-item-${r.slug}-${userId}`}
          >
            <div className="flex items-center justify-between">
              <h2
                className="font-semibold"
                id={`w33klyrep-date-${r.slug}-${userId}`}
              >
                {r.startDate} – {r.endDate}
                {r.version > 1 && <span className="ml-1">(v{r.version})</span>}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold"
                  id={`w33klyrep-tone-${r.slug}-${userId}`}
                >
                  {getCoachTone(r.coachTone).name}
                </span>
                <span
                  className="font-semibold"
                  id={`w33klyrep-score-${r.slug}-${userId}`}
                >
                  {r.score}
                </span>
                <span
                  className="ml-1 text-sm text-zinc-600"
                  id={`w33klyrep-diff-${r.slug}-${userId}`}
                >
                  {getDifficultyLabel(r.score)}
                </span>
              </div>
            </div>
            {r.summary && (
              <p
                className="mt-2 whitespace-pre-wrap"
                id={`w33klyrep-sum-${r.slug}-${userId}`}
              >
                {r.summary}
              </p>
            )}
            {r.good.length > 0 && (
              <div className="mt-2" id={`w33klyrep-good-${r.slug}-${userId}`}>
                <h3 className="font-semibold">What went well</h3>
                <ul className="list-disc pl-4">
                  {r.good.map((g, i) => (
                    <li key={i} id={`w33klyrep-good-${i}-${r.slug}-${userId}`}>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.bad.length > 0 && (
              <div className="mt-2" id={`w33klyrep-bad-${r.slug}-${userId}`}>
                <h3 className="font-semibold">What went bad</h3>
                <ul className="list-disc pl-4">
                  {r.bad.map((b, i) => (
                    <li key={i} id={`w33klyrep-bad-${i}-${r.slug}-${userId}`}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.observations.length > 0 && (
              <div className="mt-2" id={`w33klyrep-obs-${r.slug}-${userId}`}>
                <h3 className="font-semibold">Observations</h3>
                <ul className="list-disc pl-4">
                  {r.observations.map((o, i) => (
                    <li key={i} id={`w33klyrep-obs-${i}-${r.slug}-${userId}`}>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href={r.slug}
              className="mt-2 block text-sm text-orange-600 hover:underline"
              id={`w33klyrep-link-${r.slug}-${userId}`}
            >
              View details
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default async function WeeklyReportsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <WeeklyReportsHome userId={me.id} />;
}
