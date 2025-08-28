'use client';

import Textarea from '@/components/ui/textarea';
import { useViewContext } from '@/lib/view-context';
import { useEffect, useState } from 'react';
import { GenerateHeadingReportButton } from '@/components/progress/generate-heading-report-button';
import type { HeadingReport } from '@/types/report';

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

  // Load saved notes from localStorage on mount
  useEffect(() => {
    const savedRational = localStorage.getItem('review-rational');
    const savedGuilty = localStorage.getItem('review-guilty');
    if (savedRational) setRational(savedRational);
    if (savedGuilty) setGuilty(savedGuilty);
  }, []);

  const handleRationalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setRational(value);
    if (value) {
      localStorage.setItem('review-rational', value);
    } else {
      localStorage.removeItem('review-rational');
    }
  };

  const handleGuiltyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setGuilty(value);
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
            onGenerated={(r) => setReport(r as any)}
          />
        )}
        {report ? (
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold">Overview</h3>
              <p className="whitespace-pre-wrap">{report.overview}</p>
            </div>
            {report.shortTerm.length > 0 && (
              <div>
                <h3 className="font-semibold">Heading towards short term</h3>
                <ul className="list-disc pl-4">
                  {report.shortTerm.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.longTerm.length > 0 && (
              <div>
                <h3 className="font-semibold">Heading towards long term</h3>
                <ul className="list-disc pl-4">
                  {report.longTerm.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.feedback.length > 0 && (
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
              <span className="font-semibold">Progress score:</span> {report.scoreProgress}
              <span className="ml-4 font-semibold">Probability score:</span> {report.scoreProbability}
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
