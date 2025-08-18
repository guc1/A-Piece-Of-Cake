'use client';

import { useState, useEffect } from 'react';
import { useViewContext } from '@/lib/view-context';

export default function AccountSettingsPage() {
  const { editable } = useViewContext();
  const [visibility, setVisibility] = useState<'open' | 'closed' | 'private'>('open');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch('/api/account/visibility')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setVisibility(data?.accountVisibility ?? 'open'));
  }, []);

  async function save() {
    setSaving(true);
    await fetch('/api/account/visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountVisibility: visibility }),
    });
    setSaving(false);
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Account Settings</h1>
      <label className="flex items-center justify-between">
        <span>Account visibility</span>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'open' | 'closed' | 'private')}
          className="rounded border px-2 py-1"
        >
          <option value="open">open</option>
          <option value="closed">closed</option>
          <option value="private">private</option>
        </select>
      </label>
      <button
        onClick={editable ? save : undefined}
        disabled={saving || !editable}
        className="rounded bg-[var(--accent)] px-4 py-1 text-white hover:opacity-90 disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}
