'use client';

import { useEffect } from 'react';

/**
 * Applies a Date override on the client based on the `site-date` cookie.
 * This keeps the client-side clock in sync with server-side calculations.
 */
export function useApplySiteDate() {
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )site-date=(\d+)/);
    if (match) {
      const t = Number(match[1]);
      if (!Number.isNaN(t)) {
        const g = globalThis as any;
        const RealDate = g.__realDate || Date;
        g.__realDate = RealDate;
        class MockDate extends RealDate {
          constructor(...args: any[]) {
            if (args.length === 0) {
              super(t);
            } else {
              // @ts-ignore
              super(...args);
            }
          }
          static now() {
            return t;
          }
        }
        g.Date = MockDate as unknown as DateConstructor;
      }
    }
  }, []);
}
