'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { slices } from './slices';
import { Cake3D } from './cake-3d';
import { SettingsButton } from './settings-button';
import { useViewContext } from '@/lib/view-context';
import { hrefFor, type Section } from '@/lib/navigation';
import TimeMachine from '@/components/dev/time-machine';
import { GenerateDailyReportButton } from '@/components/progress/generate-daily-report-button';
import { GenerateWeeklyReportButton } from '@/components/progress/generate-weekly-report-button';
import { GenerateMonthlyReportButton } from '@/components/progress/generate-monthly-report-button';
import { GenerateYearlyReportButton } from '@/components/progress/generate-yearly-report-button';
import { cn } from '@/lib/utils';

export function CakeNavigation() {
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [offsetVh, setOffsetVh] = useState(-8);
  const [boxesOffsetVh, setBoxesOffsetVh] = useState(-6);
  const [reduced, setReduced] = useState(false);
  const ctx = useViewContext();
  const userId = String(ctx.ownerId);
  const clearTimer = useRef<NodeJS.Timeout | null>(null);
  const secretTimer = useRef<NodeJS.Timeout | null>(null);
  const secretClicks = useRef(0);
  const [timeMachineOpen, setTimeMachineOpen] = useState(false);
  const [showExtraReports, setShowExtraReports] = useState(false);
  const [weeklyStatus, setWeeklyStatus] = useState({
    visible: false,
    pending: false,
  });
  const [monthlyStatus, setMonthlyStatus] = useState({
    visible: false,
    pending: false,
  });
  const [yearlyStatus, setYearlyStatus] = useState({
    visible: false,
    pending: false,
  });

  const currentDate = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('userId', String(ctx.ownerId));
    const dateParam = params.get('apoc_date');
    let date = dateParam || '';
    if (!date) {
      const match = document.cookie.match(/apoc_clock=([^;]+)/);
      if (match) {
        const d = new Date(decodeURIComponent(match[1]));
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      if (!date) date = new Date().toISOString().slice(0, 10);
    }
    return { date };
  }, [ctx.ownerId]);

  const computeWeeklyStatus = useCallback(() => {
    const { date } = currentDate();
    const today = new Date(date);
    const day = today.getUTCDay();
    const end = new Date(today);
    if (day !== 0) end.setUTCDate(end.getUTCDate() - day);
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 6);
    const startStr = start.toISOString().slice(0, 10);
    let show = true;
    if (day === 0) {
      const dailyKey = `daily-report-generated-${ctx.ownerId}-${date}`;
      show = window.localStorage.getItem(dailyKey) === 'true';
    }
    const key = `weekly-report-generated-${ctx.ownerId}-${startStr}`;
    const generated = window.localStorage.getItem(key) === 'true';
    return { visible: show, pending: show && !generated };
  }, [currentDate, ctx.ownerId]);

  const computeMonthlyStatus = useCallback(() => {
    const { date } = currentDate();
    const today = new Date(date);
    const lastDayCurrent = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
    );
    let start: Date;
    let end: Date;
    let show = true;
    if (today.getUTCDate() === lastDayCurrent.getUTCDate()) {
      start = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
      );
      end = lastDayCurrent;
      const dailyKey = `daily-report-generated-${ctx.ownerId}-${date}`;
      show = window.localStorage.getItem(dailyKey) === 'true';
    } else {
      end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
      start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    }
    const startStr = start.toISOString().slice(0, 10);
    const key = `monthly-report-generated-${ctx.ownerId}-${startStr}`;
    const generated = window.localStorage.getItem(key) === 'true';
    return { visible: show, pending: show && !generated };
  }, [currentDate, ctx.ownerId]);

  const computeYearlyStatus = useCallback(() => {
    const { date } = currentDate();
    const today = new Date(date);
    let year = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const day = today.getUTCDate();
    let show = false;
    if (month === 11 && day === 31) {
      const decStart = `${year}-12-01`;
      const dailyKey = `daily-report-generated-${ctx.ownerId}-${date}`;
      const monthlyKey = `monthly-report-generated-${ctx.ownerId}-${decStart}`;
      show =
        window.localStorage.getItem(dailyKey) === 'true' &&
        window.localStorage.getItem(monthlyKey) === 'true';
    } else if (month === 0) {
      year = year - 1;
      const decStart = `${year}-12-01`;
      const monthlyKey = `monthly-report-generated-${ctx.ownerId}-${decStart}`;
      show = window.localStorage.getItem(monthlyKey) === 'true';
    }
    const startStr = `${year}-01-01`;
    const key = `yearly-report-generated-${ctx.ownerId}-${startStr}`;
    const generated = window.localStorage.getItem(key) === 'true';
    return { visible: show, pending: show && !generated };
  }, [currentDate, ctx.ownerId]);

  const indicatorVisible =
    weeklyStatus.visible || monthlyStatus.visible || yearlyStatus.visible;
  const indicatorPending =
    weeklyStatus.pending || monthlyStatus.pending || yearlyStatus.pending;

  useEffect(() => {
    const computeOffset = () => {
      const vh = window.innerHeight;
      let val = -8;
      if (vh < 720) val = -6;
      else if (vh >= 900) val = -10;
      setOffsetVh(val);
    };
    computeOffset();
    window.addEventListener('resize', computeOffset);
    return () => window.removeEventListener('resize', computeOffset);
  }, []);

  useEffect(() => {
    const computeBoxesOffset = () => {
      const vh = window.innerHeight;
      let val = -6;
      if (vh < 640) val = -4;
      else if (vh >= 900) val = -8;
      setBoxesOffsetVh(val);
    };
    computeBoxesOffset();
    window.addEventListener('resize', computeBoxesOffset);
    return () => window.removeEventListener('resize', computeBoxesOffset);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(media.matches);
    setReduced(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const compute = () => {
      setWeeklyStatus(computeWeeklyStatus());
      setMonthlyStatus(computeMonthlyStatus());
      setYearlyStatus(computeYearlyStatus());
    };
    compute();
    window.addEventListener('storage', compute);
    return () => window.removeEventListener('storage', compute);
  }, [computeWeeklyStatus, computeMonthlyStatus, computeYearlyStatus]);

  function handleEnter(slug: string) {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
    setActiveSlug(slug);
    setHoveredSlug(slug);
  }

  function handleLeave() {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
    clearTimer.current = setTimeout(() => {
      setActiveSlug(null);
      setHoveredSlug(null);
    }, 80);
  }

  const hoveredLabel = hoveredSlug
    ? (slices.find((s) => s.slug === hoveredSlug)?.label ?? '')
    : '';

  return (
    <div
      className="relative grid w-full justify-items-center"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      {ctx.editable && <SettingsButton />}
      <div
        className="grid w-full place-items-center"
        style={{ marginBottom: 'clamp(24px,3vh,36px)' }}
      >
        <h1
          id="cak3titleText"
          className="text-center font-bold tracking-[0.004em]"
          style={{
            color: 'var(--text)',
            fontSize: 'clamp(22px,2.4vw,32px)',
          }}
        >
          A Pie
          <span
            onClick={() => {
              secretClicks.current += 1;
              if (secretClicks.current >= 5) {
                setTimeMachineOpen(true);
                secretClicks.current = 0;
              }
              if (secretTimer.current) clearTimeout(secretTimer.current);
              secretTimer.current = setTimeout(() => {
                secretClicks.current = 0;
              }, 1000);
            }}
            className="cursor-default select-none"
          >
            c
          </span>
          e Of Cake
        </h1>
      </div>
      <div
        className="grid w-full place-items-center"
        style={{
          height: 'clamp(420px,54vh,720px)',
          transform: `translateY(${offsetVh}vh)`,
        }}
      >
        <Cake3D
          activeSlug={activeSlug}
          hoveredSlug={hoveredSlug}
          onHover={handleEnter}
          onLeave={handleLeave}
          userId={userId}
        />
      </div>
      <div className="grid w-full place-items-center relative">
        {ctx.editable && (
          <>
            <div
              className="absolute -translate-x-1/2"
              style={{ top: '-66px', left: '50%' }}
            >
              <div className="relative flex justify-center">
                <GenerateDailyReportButton
                  userId={ctx.ownerId}
                  buttonClassName="px-8 py-4 text-lg"
                />
                {indicatorVisible && (
                  <div className="absolute left-full ml-4">
                    <button
                      onClick={() => setShowExtraReports(true)}
                      className={cn(
                        'rounded px-6 py-4 text-lg text-white',
                        indicatorPending
                          ? 'bg-green-500 hover:bg-green-600 animate-bounce'
                          : 'bg-orange-500 hover:bg-orange-600',
                      )}
                    >
                      new
                    </button>
                  </div>
                )}
              </div>
            </div>
            {showExtraReports && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="relative w-full max-w-lg p-4">
                  <button
                    onClick={() => setShowExtraReports(false)}
                    className="absolute right-4 top-4 rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                  >
                    Close
                  </button>
                  <div className="flex flex-col items-center gap-6 pt-10">
                    <GenerateWeeklyReportButton
                      userId={ctx.ownerId}
                      onStatusChange={setWeeklyStatus}
                      className="w-full"
                      buttonClassName="w-full py-6 text-lg whitespace-normal"
                    />
                    <GenerateMonthlyReportButton
                      userId={ctx.ownerId}
                      onStatusChange={setMonthlyStatus}
                      className="w-full"
                      buttonClassName="w-full py-6 text-lg whitespace-normal"
                    />
                    <GenerateYearlyReportButton
                      userId={ctx.ownerId}
                      onStatusChange={setYearlyStatus}
                      className="w-full"
                      buttonClassName="w-full py-6 text-lg whitespace-normal"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <nav
          className="grid grid-cols-2 place-items-center gap-3 sm:grid-cols-3 xl:grid-cols-6"
          style={{
            marginTop: 'clamp(32px,6vh,96px)',
            transform: `translateY(${boxesOffsetVh}vh)`,
          }}
        >
          {slices.map((slice) => {
            const popped = hoveredSlug === slice.slug;
            const scale = popped ? (reduced ? 1.02 : 1.08) : 1;
            const transition = popped
              ? 'transform 140ms ease-out, background-color 140ms ease-out, box-shadow 140ms ease-out, border-color 140ms ease-out'
              : 'transform 160ms ease-in, background-color 160ms ease-in, box-shadow 160ms ease-in, border-color 160ms ease-in';
            return (
              <button
                key={slice.slug}
                id={`n4vbox-${slice.slug}-${userId}`}
                data-popped={popped ? true : undefined}
                aria-label={slice.label}
                onClick={() => router.push(hrefFor(slice.slug as Section, ctx))}
                onMouseEnter={() => handleEnter(slice.slug)}
                onMouseLeave={handleLeave}
                onFocus={() => handleEnter(slice.slug)}
                onBlur={handleLeave}
                className={`flex h-[42px] min-w-[168px] items-center justify-center gap-2 rounded border px-4 text-[0.95rem] font-normal text-[var(--text)] shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                  popped ? 'shadow-md' : ''
                }`}
                style={{
                  transform: `scale(${scale})`,
                  transition,
                  willChange: 'transform',
                  backgroundColor: popped
                    ? 'color-mix(in srgb, var(--surface), white 4%)'
                    : 'var(--surface)',
                  borderColor: popped ? 'hsl(var(--accent) / 0.24)' : undefined,
                }}
              >
                <slice.Icon className="h-4 w-4" />
                {slice.label}
              </button>
            );
          })}
        </nav>
      </div>
      <p className="sr-only" aria-live="polite">
        {hoveredLabel}
      </p>
      <TimeMachine
        open={timeMachineOpen}
        onClose={() => setTimeMachineOpen(false)}
      />
    </div>
  );
}
