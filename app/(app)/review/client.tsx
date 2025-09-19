'use client';

import Textarea from '@/components/ui/textarea';
import { useViewContext } from '@/lib/view-context';
import { useEffect, useMemo, useState } from 'react';
import { GenerateHeadingReportButton } from '@/components/progress/generate-heading-report-button';
import type { HeadingReport } from '@/types/report';
import { getCoachTone } from '@/lib/ai/coach-tone';

export function ReviewHome({
  userId,
  initialReport,
}: {
  userId: number;
  initialReport: HeadingReport | null;
}) {
  const { editable } = useViewContext();
  const [rational, setRational] = useState('');
  const [guilty, setGuilty] = useState('');
  const [report, setReport] = useState<HeadingReport | null>(initialReport);

  useEffect(() => {
    setReport(initialReport);
  }, [initialReport]);

  const toneName = useMemo(
    () => (report ? getCoachTone(report.coachTone).name : null),
    [report],
  );
  const toneCustom = useMemo(() => {
    if (report?.coachTone !== 'tone_custom') return '';
    return report.coachToneCustom?.trim() ?? '';
  }, [report]);

  // Load saved notes from localStorage on mount
  useEffect(() => {
    if (!editable) return;
    const savedRational = localStorage.getItem('review-rational');
    const savedGuilty = localStorage.getItem('review-guilty');
    if (savedRational) setRational(savedRational);
    if (savedGuilty) setGuilty(savedGuilty);
  }, [editable]);

  const handleRationalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setRational(value);
    if (!editable) return;
    if (value) {
      localStorage.setItem('review-rational', value);
    } else {
      localStorage.removeItem('review-rational');
    }
  };

  const handleGuiltyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setGuilty(value);
    if (!editable) return;
    if (value) {
      localStorage.setItem('review-guilty', value);
    } else {
      localStorage.removeItem('review-guilty');
    }
  };
  return (
    <section className="grid h-[calc(100vh-2rem)] grid-cols-2 gap-4 overflow-hidden">
      <div className="flex flex-col overflow-y-scroll pr-4">
        <h2 className="mb-2 text-xl font-semibold">Your rational</h2>
        <Textarea
          className="min-h-[1500px]"
          placeholder="Type here"
          disabled={!editable}
          value={rational}
          onChange={handleRationalChange}
        />
        <hr className="my-4" />
        <h2 className="mb-2 text-xl font-semibold">guilty pleasure</h2>
        <Textarea
          className="min-h-[1500px]"
          placeholder="Type here"
          disabled={!editable}
          value={guilty}
          onChange={handleGuiltyChange}
        />
      </div>
      <div className="flex flex-col overflow-y-scroll border-l pl-4">
        {editable && (
          <GenerateHeadingReportButton
            userId={userId}
            onGenerated={(partial) =>
              setReport((prev) => {
                if (!partial) return prev;
                const now = new Date().toISOString();
                if (!prev) {
                  return {
                    id: 0,
                    userId,
                    date: now.slice(0, 10),
                    version: 1,
                    overview: partial.overview ?? '',
                    shortTerm: partial.shortTerm ?? [],
                    longTerm: partial.longTerm ?? [],
                    feedback: partial.feedback ?? [],
                    scoreProgress: partial.scoreProgress ?? 0,
                    scoreProbability: partial.scoreProbability ?? 0,
                    coachTone: partial.coachTone ?? 'tone_medium',
                    coachToneCustom: partial.coachToneCustom ?? '',
                    createdAt: now,
                  };
                }
                return {
                  ...prev,
                  ...partial,
                  overview: partial.overview ?? prev.overview,
                  shortTerm: partial.shortTerm ?? prev.shortTerm,
                  longTerm: partial.longTerm ?? prev.longTerm,
                  feedback: partial.feedback ?? prev.feedback,
                  scoreProgress:
                    partial.scoreProgress ?? prev.scoreProgress,
                  scoreProbability:
                    partial.scoreProbability ?? prev.scoreProbability,
                  coachTone: partial.coachTone ?? prev.coachTone,
                  coachToneCustom:
                    partial.coachToneCustom ?? prev.coachToneCustom,
                };
              })
            }
          />
        )}
        {report ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-orange-600">
                  Coach tone: {toneName ?? 'Medium'}
                </span>
              </div>
              {toneCustom ? (
                <p className="mt-2 whitespace-pre-wrap text-orange-700">
                  {toneCustom}
                </p>
              ) : (
                <p className="mt-2 text-xs text-orange-600/80">
                  Using preset guidance for this tone.
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold">Overview</h3>
              <p className="whitespace-pre-wrap">{report.overview}</p>
            </div>
            {report.shortTerm?.length > 0 && (
              <div>
                <h3 className="font-semibold">Heading towards short term</h3>
                <ul className="list-disc pl-4">
                  {report.shortTerm.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.longTerm?.length > 0 && (
              <div>
                <h3 className="font-semibold">Heading towards long term</h3>
                <ul className="list-disc pl-4">
                  {report.longTerm.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.feedback?.length > 0 && (
              <div>
                <h3 className="font-semibold">Feedback</h3>
                <ul className="list-disc pl-4">
                  {report.feedback.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-2">
              <span className="font-semibold">Progress score:</span>{' '}
              {report.scoreProgress}
              <span className="ml-4 font-semibold">
                Probability score:
              </span>{' '}
              {report.scoreProbability}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No overview report yet.
          </div>
        )}
      </div>
    </section>
  );
}
