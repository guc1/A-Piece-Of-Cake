import Link from 'next/link';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { listDailyReports } from '@/lib/daily-report-store';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { getDifficultyLabel } from '@/lib/ai/difficulty';
import { listProfileSnapshotDates } from '@/lib/profile-snapshots';
import StickyHeader from '@/components/sticky-header';
import { RangeNav } from '@/components/range-nav';

export async function DailyReportsHome({
  userId,
  start,
}: {
  userId: number;
  start?: string;
}) {
  const [reports, snapshots] = await Promise.all([
    listDailyReports(userId),
    listProfileSnapshotDates(userId),
  ]);
  const reportMap = new Map<string, (typeof reports)[number]>();
  for (const r of reports) {
    if (!reportMap.has(r.date)) reportMap.set(r.date, r);
  }
  const allDates = Array.from(
    new Set([...snapshots, ...reports.map((r) => r.date)]),
  ).sort((a, b) => (a < b ? 1 : -1));
  const items = allDates.map(
    (date) => reportMap.get(date) ?? { date, missing: true as const },
  );
  const startIndex = start ? items.findIndex((i) => i.date === start) : 0;
  const slice = items.slice(startIndex, startIndex + 7);
  const prevStart = items[startIndex + 7]?.date;
  const nextStart = startIndex > 0 ? items[startIndex - 7]?.date : undefined;
  return (
    <>
      <StickyHeader title="Daily Reports">
        <RangeNav
          prev={prevStart}
          next={nextStart}
          prevLabel="Previous 7 days"
          nextLabel="Next 7 days"
        />
      </StickyHeader>
      <main className="p-6 pt-20">
        <ul className="space-y-4" id={`d41lyrep-list-${userId}`}>
          {slice.map((r) =>
            'missing' in r ? (
              <li
                key={r.date}
                className="rounded border p-4"
                id={`d41lyrep-miss-${r.date}-${userId}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{r.date}</h2>
                  <span className="font-semibold text-red-600">
                    No Assessment
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  This day the user did not generate a daily assessment.
                </p>
              </li>
            ) : (
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
                    {r.version > 1 && (
                      <span className="ml-1">(v{r.version})</span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold"
                      id={`d41lyrep-tone-${r.slug}-${userId}`}
                    >
                      {getCoachTone(r.coachTone).name}
                    </span>
                    <span
                      className="font-semibold"
                      id={`d41lyrep-score-${r.slug}-${userId}`}
                    >
                      {r.score}
                    </span>
                    <span
                      className="ml-1 text-sm text-zinc-600"
                      id={`d41lyrep-diff-${r.slug}-${userId}`}
                    >
                      {getDifficultyLabel(r.score)}
                    </span>
                  </div>
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
                  <div
                    className="mt-2"
                    id={`d41lyrep-good-${r.slug}-${userId}`}
                  >
                    <h3 className="font-semibold">What went well</h3>
                    <ul className="list-disc pl-4">
                      {r.good.map((g, i) => (
                        <li
                          key={i}
                          id={`d41lyrep-good-${i}-${r.slug}-${userId}`}
                        >
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
                        <li
                          key={i}
                          id={`d41lyrep-bad-${i}-${r.slug}-${userId}`}
                        >
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
                        <li
                          key={i}
                          id={`d41lyrep-obs-${i}-${r.slug}-${userId}`}
                        >
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
            ),
          )}
        </ul>
      </main>
    </>
  );
}

export default async function DailyReportsPage({
  searchParams,
}: {
  searchParams: { start?: string };
}) {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  return <DailyReportsHome userId={me.id} start={searchParams.start} />;
}
