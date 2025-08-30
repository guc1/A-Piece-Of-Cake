'use client';
import { useEffect } from 'react';

export default function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = document.cookie.match(/(?:^|; )apoc_tz=([^;]+)/);
    const current = match ? decodeURIComponent(match[1]) : null;
    if (current !== tz) {
      document.cookie = `apoc_tz=${tz}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  }, []);
  return null;
}
