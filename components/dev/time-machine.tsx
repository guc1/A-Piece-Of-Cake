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
  const realDateRef = useRef<DateConstructor | null>(
    (globalThis as any).__realDate || null,
  );

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

  function applyOverride() {
    if (!date) return;
    const t = new Date(date).getTime();
    if (!realDateRef.current) {
      realDateRef.current = (globalThis as any).__realDate || Date;
    }
    (globalThis as any).__realDate = realDateRef.current;
    const RealDate = realDateRef.current as DateConstructor;
    class MockDate extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(t);
        } else {
          // @ts-ignore -- spread args for Date constructor
          super(...args);
        }
      }
      static now() {
        return t;
      }
    }
    (globalThis as any).Date = MockDate as unknown as DateConstructor;
    document.cookie = `site-date=${t}; path=/`;
    handleClose();
  }

  function resetOverride() {
    const g = globalThis as any;
    const RealDate = realDateRef.current || g.__realDate;
    if (RealDate) {
      g.Date = RealDate;
    }
    realDateRef.current = null;
    delete g.__realDate;
    document.cookie = 'site-date=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  function resetToCurrentNl() {
    const amsString = new Date().toLocaleString('en-US', {
      timeZone: 'Europe/Amsterdam',
      timeZoneName: 'short',
    });
    const [base, tz] = amsString.split(' GMT');
    const offset = parseInt(tz, 10) * 60 * 60 * 1000;
    const t = new Date(base).getTime() - offset;
    if (!realDateRef.current) {
      realDateRef.current = (globalThis as any).__realDate || Date;
    }
    (globalThis as any).__realDate = realDateRef.current;
    const RealDate = realDateRef.current as DateConstructor;
    class MockDate extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(t);
        } else {
          // @ts-ignore -- spread args for Date constructor
          super(...args);
        }
      }
      static now() {
        return t;
      }
    }
    (globalThis as any).Date = MockDate as unknown as DateConstructor;
    document.cookie = `site-date=${t}; path=/`;
    handleClose();
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
