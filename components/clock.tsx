'use client';

import { useEffect, useState } from 'react';

export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Explicit locale to keep server and client rendering in sync
  const formatted = now.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  return <span className="text-sm">{formatted}</span>;
}
