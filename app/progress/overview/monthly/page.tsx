import Link from 'next/link';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listMonthlyReports } from '@/lib/monthly-report-store';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { listDailyReportDates } from '@/lib/daily-report-store';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { getDifficultyLabel } from '@/lib/ai/difficulty';
import BackButton from '@/components/back-button';

function slugFromRange(start: string, end: string): string {
  const [ys, ms, ds] = start.split('-');
  const [ye, me, de] = end.split('-');
  return `${ds}${ms}${ys}-${de}${me}${ye}`;
}

export async function MonthlyReportsHome({ userId }: { userId: number }) {
  const [reports, weekly, dailyDates] = await Promise.all([
    listMonthlyReports(userId),
    listWeeklyReports(userId),
    listDailyReportDates(userId),
  ]);
  const reportMap = new Map(reports.map((r) => [r.startDate.slice(0, 7), r]));
  const monthsSet = new Set<string>();
  for (const d of dailyDates) monthsSet.add(d.slice(0, 7));
  for (const w of weekly) monthsSet.add(w.startDate.slice(0, 7));
  for (const r of reports) monthsSet.add(r.startDate.slice(0, 7));
  const months = Array.from(monthsSet).sort();
  if (months.length === 0)
    return (
      <main className="p-6">
        <BackButton />
        <h1 className="mb-4 text-2xl font-bold">Monthly Reports</h1>
        <p>No monthly data yet.</p>
      </main>
    );

  const first = new Date(months[0] + '-01');
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevMonthStart = new Date(currentMonthStart);
  prevMonthStart.setUTCMonth(prevMonthStart.getUTCMonth() - 1);

  const list: Array<{ start: string; end: string; report?: (typeof reports)[number] }> = [];
  for (
    let d = new Date(first);
    d < currentMonthStart;
    d.setUTCMonth(d.getUTCMonth() + 1)
  ) {
    const start = d.toISOString().slice(0, 10);
    const endDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
    const end = endDate.toISOString().slice(0, 10);
    const key = start.slice(0, 7);
    list.push({ start, end, report: reportMap.get(key) });
  }

  return (
    <main className="p-6">
      <BackButton />
      <h1 className="mb-4 text-2xl font-bold">Monthly Reports</h1>
      <ul className="space-y-4" id={`m0nthlyrep-list-${userId}`}>
        {list.map((m) => {
          if (m.report) {
            const r = m.report;
            return (
              <li
                key={r.slug}
                className="rounded border p-4"
                id={`m0nthlyrep-item-${r.slug}-${userId}`}
              >
                <div className="flex items-center justify-between">
                  <h2
                    className="font-semibold"
                    id={`m0nthlyrep-date-${r.slug}-${userId}`}
                  >
                    {r.startDate} – {r.endDate}
                    {r.version > 1 && <span className="ml-1">(v{r.version})</span>}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold"
                      id={`m0nthlyrep-tone-${r.slug}-${userId}`}
                    >
                      {getCoachTone(r.coachTone).name}
                    </span>
                    <span
                      className="font-semibold"
                      id={`m0nthlyrep-score-${r.slug}-${userId}`}
                    >
                      {r.score}
                    </span>
                    <span
                      className="ml-1 text-sm text-zinc-600"
                      id={`m0nthlyrep-diff-${r.slug}-${userId}`}
                    >
                      {getDifficultyLabel(r.score)}
                    </span>
                  </div>
                </div>
                {r.summary && (
                  <p
                    className="mt-2 whitespace-pre-wrap"
                    id={`m0nthlyrep-sum-${r.slug}-${userId}`}
                  >
                    {r.summary}
                  </p>
                )}
                {r.good.length > 0 && (
                  <div className="mt-2" id={`m0nthlyrep-good-${r.slug}-${userId}`}>
                    <h3 className="font-semibold">What went well</h3>
                    <ul className="list-disc pl-4">
                      {r.good.map((g, i) => (
                        <li key={i} id={`m0nthlyrep-good-${i}-${r.slug}-${userId}`}>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.bad.length > 0 && (
                  <div className="mt-2" id={`m0nthlyrep-bad-${r.slug}-${userId}`}>
                    <h3 className="font-semibold">What went bad</h3>
                    <ul className="list-disc pl-4">
                      {r.bad.map((b, i) => (
                        <li key={i} id={`m0nthlyrep-bad-${i}-${r.slug}-${userId}`}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.observations.length > 0 && (
                  <div className="mt-2" id={`m0nthlyrep-obs-${r.slug}-${userId}`}>
                    <h3 className="font-semibold">Observations</h3>
                    <ul className="list-disc pl-4">
                      {r.observations.map((o, i) => (
                        <li key={i} id={`m0nthlyrep-obs-${i}-${r.slug}-${userId}`}>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Link
                  href={r.slug}
                  className="mt-2 block text-sm text-orange-600 hover:underline"
                  id={`m0nthlyrep-link-${r.slug}-${userId}`}
                >
                  View details
                </Link>
              </li>
            );
          }
          if (m.start >= prevMonthStart.toISOString().slice(0, 10)) return null;
          const slug = slugFromRange(m.start, m.end);
          return (
            <li
              key={slug}
              className="rounded border p-4"
              id={`m0nthlyrep-miss-${slug}-${userId}`}
            >
              <h2
                className="font-semibold"
                id={`m0nthlyrep-date-${slug}-${userId}`}
              >
                {m.start} – {m.end}
              </h2>
              <p className="mt-2" id={`m0nthlyrep-miss-msg-${slug}-${userId}`}>
                This month the user did not generate a monthly assessment.
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default async function MonthlyReportsPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <MonthlyReportsHome userId={me.id} />;
}
