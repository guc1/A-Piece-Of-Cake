import Link from 'next/link';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listYearlyReports } from '@/lib/yearly-report-store';
import { listMonthlyReports } from '@/lib/monthly-report-store';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { listDailyReportDates } from '@/lib/daily-report-store';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { getDifficultyLabel } from '@/lib/ai/difficulty';

function slugFromRange(start: string, end: string): string {
  const [ys, ms, ds] = start.split('-');
  const [ye, me, de] = end.split('-');
  return `${ds}${ms}${ys}-${de}${me}${ye}`;
}

export async function YearlyReportsHome({ userId }: { userId: number }) {
  const [reports, monthly, weekly, dailyDates] = await Promise.all([
    listYearlyReports(userId),
    listMonthlyReports(userId),
    listWeeklyReports(userId),
    listDailyReportDates(userId),
  ]);
  const reportMap = new Map(reports.map((r) => [r.startDate.slice(0, 4), r]));
  const yearsSet = new Set<string>();
  for (const m of monthly) yearsSet.add(m.startDate.slice(0, 4));
  for (const w of weekly) yearsSet.add(w.startDate.slice(0, 4));
  for (const d of dailyDates) yearsSet.add(d.slice(0, 4));
  for (const r of reports) yearsSet.add(r.startDate.slice(0, 4));
  const years = Array.from(yearsSet).sort();
  if (years.length === 0)
    return (
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-bold">Yearly Reports</h1>
        <p>No yearly data yet.</p>
      </main>
    );

  const first = Number(years[0]);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const list: Array<{ start: string; end: string; report?: (typeof reports)[number] }> = [];
  for (let y = first; y < currentYear; y++) {
    const start = `${y}-01-01`;
    const end = `${y}-12-31`;
    list.push({ start, end, report: reportMap.get(String(y)) });
  }

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Yearly Reports</h1>
      <ul className="space-y-4" id={`y3arlyrep-list-${userId}`}>
        {list.map((y) => {
          if (y.report) {
            const r = y.report;
            return (
              <li
                key={r.slug}
                className="rounded border p-4"
                id={`y3arlyrep-item-${r.slug}-${userId}`}
              >
                <div className="flex items-center justify-between">
                  <h2
                    className="font-semibold"
                    id={`y3arlyrep-date-${r.slug}-${userId}`}
                  >
                    {r.startDate} – {r.endDate}
                    {r.version > 1 && <span className="ml-1">(v{r.version})</span>}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold"
                      id={`y3arlyrep-tone-${r.slug}-${userId}`}
                    >
                      {getCoachTone(r.coachTone).name}
                    </span>
                    <span
                      className="font-semibold"
                      id={`y3arlyrep-score-${r.slug}-${userId}`}
                    >
                      {r.score}
                    </span>
                    <span
                      className="ml-1 text-sm text-zinc-600"
                      id={`y3arlyrep-diff-${r.slug}-${userId}`}
                    >
                      {getDifficultyLabel(r.score)}
                    </span>
                  </div>
                </div>
                {r.summary && (
                  <p
                    className="mt-2 whitespace-pre-wrap"
                    id={`y3arlyrep-sum-${r.slug}-${userId}`}
                  >
                    {r.summary}
                  </p>
                )}
                {r.good.length > 0 && (
                  <div className="mt-2" id={`y3arlyrep-good-${r.slug}-${userId}`}>
                    <h3 className="font-semibold">What went well</h3>
                    <ul className="list-disc pl-4">
                      {r.good.map((g, i) => (
                        <li key={i} id={`y3arlyrep-good-${i}-${r.slug}-${userId}`}>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.bad.length > 0 && (
                  <div className="mt-2" id={`y3arlyrep-bad-${r.slug}-${userId}`}>
                    <h3 className="font-semibold">What went bad</h3>
                    <ul className="list-disc pl-4">
                      {r.bad.map((b, i) => (
                        <li key={i} id={`y3arlyrep-bad-${i}-${r.slug}-${userId}`}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.observations.length > 0 && (
                  <div className="mt-2" id={`y3arlyrep-obs-${r.slug}-${userId}`}>
                    <h3 className="font-semibold">Observations</h3>
                    <ul className="list-disc pl-4">
                      {r.observations.map((o, i) => (
                        <li key={i} id={`y3arlyrep-obs-${i}-${r.slug}-${userId}`}>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Link
                  href={r.slug}
                  className="mt-2 block text-sm text-orange-600 hover:underline"
                  id={`y3arlyrep-link-${r.slug}-${userId}`}
                >
                  View details
                </Link>
              </li>
            );
          }
          const year = y.start.slice(0, 4);
          if (Number(year) === currentYear - 1 && now.getUTCMonth() === 0)
            return null;
          const slug = slugFromRange(y.start, y.end);
          return (
            <li
              key={slug}
              className="rounded border p-4"
              id={`y3arlyrep-miss-${slug}-${userId}`}
            >
              <h2
                className="font-semibold"
                id={`y3arlyrep-date-${slug}-${userId}`}
              >
                {y.start} – {y.end}
              </h2>
              <p className="mt-2" id={`y3arlyrep-miss-msg-${slug}-${userId}`}>
                This year the user did not generate a yearly assessment.
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default async function YearlyReportsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <YearlyReportsHome userId={me.id} />;
}
