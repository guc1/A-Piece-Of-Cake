'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useViewContext } from '@/lib/view-context';
import { hrefFor } from '@/lib/navigation';
import { signOut } from 'next-auth/react';

function GearIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.02a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .69.4 1.31 1 1.51h.02a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.46-.6 1.12-.33 1.82.27.7.91 1.18 1.64 1.18H21a2 2 0 0 1 0 4h-.09c-.69 0-1.31.4-1.51 1z" />
    </svg>
  );
}

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [followers, setFollowers] = useState(0);
  const ctx = useViewContext();

  useEffect(() => {
    const storedTheme = localStorage.getItem('color-mode');
    if (storedTheme === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    async function refresh() {
      const res = await fetch('/api/account/followers');
      const data = res.ok ? await res.json() : null;
      setFollowers(data?.count ?? 0);
    }
    if (open) {
      refresh();
      interval = setInterval(refresh, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open]);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-mode', 'light');
    }
  }, [dark]);

  return (
    <div className="absolute right-4 top-4 z-50 text-[var(--text)]">
      <button
        aria-label="Settings"
        onClick={() => setOpen((v) => !v)}
        className="rounded p-2 hover:bg-[var(--surface)]"
      >
        <GearIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="mt-2 w-56 rounded border bg-[var(--surface)] p-4 text-sm shadow-md">
          <div className="mb-2">Followers: {followers}</div>
          <div className="mb-2 flex items-center justify-between">
            <span>Dark Mode</span>
            <input
              type="checkbox"
              checked={dark}
              onChange={(e) => setDark(e.target.checked)}
              className="cursor-pointer"
            />
          </div>
          <Link
            href={hrefFor('/settings/account', ctx)}
            className="mb-2 block rounded bg-[var(--surface)] px-3 py-1 text-center hover:bg-[var(--accent)] hover:text-white"
          >
            Account settings
          </Link>
          <button
            className="mt-2 w-full rounded bg-[var(--accent)] px-3 py-1 text-white hover:opacity-90"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
