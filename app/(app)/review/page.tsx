'use client';

import Textarea from '@/components/ui/textarea';
import { useViewContext } from '@/lib/view-context';
import { useEffect, useState } from 'react';

export function ReviewHome() {
  const { editable } = useViewContext();
  const [rational, setRational] = useState('');
  const [guilty, setGuilty] = useState('');

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
      <div className="flex items-center justify-center overflow-y-scroll border-l pl-4 text-gray-400">
        AI features coming soon...
      </div>
    </section>
  );
}

export default function ReviewPage() {
  return <ReviewHome />;
}
