'use client';

import { useRef, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TimeMachine({ open, onClose }: Props) {
  const [stage, setStage] = useState<'code' | 'time'>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [date, setDate] = useState('');
  (globalThis as any)._realDate = (globalThis as any)._realDate || Date;
  const realDateRef = useRef<DateConstructor>((globalThis as any)._realDate);

  if (!open) return null;

  function handleVerify() {
    if (code.trim() === 'hsug') {
      setStage('time');
      setCode('');
      setError('');
    } else {
      setError('Incorrect code');
    }
  }

  function override(offset: number) {
    const RealDate = realDateRef.current;
    class MockDate extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(RealDate.now() + offset);
        } else {
          // @ts-ignore -- spread args for Date constructor
          super(...args);
        }
      }
      static now() {
        return RealDate.now() + offset;
      }
    }
    (globalThis as any).Date = MockDate as unknown as DateConstructor;
    localStorage.setItem('timeOffset', String(offset));
    document.cookie = `timeOffset=${offset}; path=/`;
  }

  function applyOverride() {
    if (!date) return;
    const RealDate = realDateRef.current;
    const target = new Date(date).getTime();
    const offset = target - RealDate.now();
    override(offset);
    handleClose();
    window.location.reload();
  }

  function resetOverride() {
    const RealDate = realDateRef.current;
    (globalThis as any).Date = RealDate;
    localStorage.removeItem('timeOffset');
    document.cookie = 'timeOffset=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    handleClose();
    window.location.reload();
  }

  function resetToCurrentNl() {
    const RealDate = realDateRef.current;
    const amsString = new RealDate().toLocaleString('en-US', {
      timeZone: 'Europe/Amsterdam',
      timeZoneName: 'short',
    });
    const [base, tz] = amsString.split(' GMT');
    const offsetMs = parseInt(tz, 10) * 60 * 60 * 1000;
    const t = new RealDate(base).getTime() - offsetMs;
    const offset = t - RealDate.now();
    override(offset);
    handleClose();
    window.location.reload();
  }

  function handleClose() {
    setStage('code');
    setCode('');
    setError('');
    setDate('');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="relative w-[min(90%,320px)] rounded bg-[var(--surface)] p-4 text-[var(--text)] shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 rounded px-2 text-sm text-[var(--text)] hover:bg-[var(--surface)]/80"
        >
          ×
        </button>
        {stage === 'code' ? (
          <div className="mt-2">
            <p className="mb-2">Enter code</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mb-2 w-full rounded border border-[var(--border)] bg-transparent p-2"
              type="password"
            />
            {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
            <button
              onClick={handleVerify}
              className="rounded bg-[var(--accent)] px-3 py-1 text-white"
            >
              Submit
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <p className="mb-2">Set site date & time</p>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mb-2 w-full rounded border border-[var(--border)] bg-transparent p-2"
            />
            <div className="flex gap-2">
              <button
                onClick={applyOverride}
                className="rounded bg-[var(--accent)] px-3 py-1 text-white"
              >
                Apply
              </button>
              <button
                onClick={resetToCurrentNl}
                className="rounded border border-[var(--border)] px-3 py-1"
              >
                Reset to current time
              </button>
              <button
                onClick={resetOverride}
                className="rounded border border-[var(--border)] px-3 py-1"
              >
                Restore
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeMachine;
