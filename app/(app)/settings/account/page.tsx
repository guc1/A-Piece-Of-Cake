'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AccountSettingsPage() {
  const [visibility, setVisibility] = useState<'open' | 'closed' | 'private'>('open');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/account/visibility')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.accountVisibility) {
          setVisibility(data.accountVisibility);
        }
      });
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
      <label className="flex items-center gap-2">
        <span>Visibility</span>
        <select
          className="rounded border px-1 py-0.5"
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value as 'open' | 'closed' | 'private')
          }
        >
          <option value="open">open</option>
          <option value="closed">closed</option>
          <option value="private">private</option>
        </select>
      </label>
      <Button onClick={save} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
