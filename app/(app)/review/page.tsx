'use client';

import Textarea from '@/components/ui/textarea';
import { useViewContext } from '@/lib/view-context';
import { useEffect, useState } from 'react';

interface OverviewReport {
  Overview: string;
  ['short-term']: string[];
  ['long-term']: string[];
  feedback: string[];
  ['score-progress']: number;
  ['score-probability']: number;
  date: string;
}

export function ReviewHome() {
  const { editable } = useViewContext();
  const [rational, setRational] = useState('');
  const [guilty, setGuilty] = useState('');
  const [report, setReport] = useState<OverviewReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Load saved notes and existing report from localStorage/API on mount
  useEffect(() => {
    const savedRational = localStorage.getItem('review-rational');
    const savedGuilty = localStorage.getItem('review-guilty');
    if (savedRational) setRational(savedRational);
    if (savedGuilty) setGuilty(savedGuilty);
    fetch('/api/progress/overview-report')
      .then((res) => res.json())
      .then((data) => {
        if (data.report) setReport(data.report);
      })
      .catch(() => {});
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

  const today = new Date().toISOString().slice(0, 10);
  const generatedToday = report?.date === today;

  const handleGenerate = async () => {
    if (generatedToday) {
      const code = prompt('Enter regeneration code');
      if (code !== 'cake2025') return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/progress/overview-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rational, guilty }),
      });
      const data = await res.json();
      if (data.report) {
        data.report.date = data.date;
        setReport(data.report);
      }
    } finally {
      setLoading(false);
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
        {report ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">General observations</h2>
              <p className="whitespace-pre-wrap">{report.Overview}</p>
            </div>
            {report['short-term'].length > 0 && (
              <div>
                <h3 className="font-semibold">Heading towards short term</h3>
                <ul className="list-disc pl-4">
                  {report['short-term'].map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {report['long-term'].length > 0 && (
              <div>
                <h3 className="font-semibold">Heading towards long term</h3>
                <ul className="list-disc pl-4">
                  {report['long-term'].map((s, i) => (
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
            <div className="font-semibold">
              Progress score: {report['score-progress']} | Probability score:{' '}
              {report['score-probability']}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            No overview report yet.
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`mt-4 w-full rounded px-4 py-2 font-semibold text-white ${
            generatedToday ? 'bg-orange-500' : 'bg-green-600'
          }`}
        >
          {generatedToday
            ? 'Regenerate overview rapport'
            : 'Generate overview rapport'}
        </button>
      </div>
    </section>
  );
}

export default function ReviewPage() {
  return <ReviewHome />;
}
