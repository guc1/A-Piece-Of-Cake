'use client';

import { useEffect, useRef } from 'react';
import { snapshotProfileAction } from '@/app/(app)/snapshot/actions';

export function SnapshotScheduler() {
  const lastDate = useRef<string>(new Date().toDateString());

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const current = now.toDateString();
      if (current !== lastDate.current) {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        snapshotProfileAction(y.toISOString().slice(0, 10));
        lastDate.current = current;
      }
    };
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  return null;
}
