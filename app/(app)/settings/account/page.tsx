'use client';

import { useState, useEffect } from 'react';
import { useViewContext } from '@/lib/view-context';
import type { CoachToneId } from '@/lib/ai/coach-tone';

export default function AccountSettingsPage() {
  const { editable } = useViewContext();
  const [visibility, setVisibility] = useState<'open' | 'closed' | 'private'>('open');
  const [tone, setTone] = useState<CoachToneId>('tone_medium');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch('/api/account/visibility')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setVisibility(data?.accountVisibility ?? 'open'));
    fetch('/api/account/tone')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTone(data?.coachTone ?? 'tone_medium'));
  }, []);

  async function save() {
    setSaving(true);
    await Promise.all([
      fetch('/api/account/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountVisibility: visibility }),
      }),
      fetch('/api/account/tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachTone: tone }),
      }),
    ]);
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
      <label className="flex items-center justify-between">
        <span>Coach tone</span>
        <div className="flex flex-col items-center">
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={
              ['tone_soft', 'tone_medium', 'tone_hard', 'tone_superhard'].indexOf(
                tone,
              )
            }
            onChange={(e) =>
              setTone(
                ['tone_soft', 'tone_medium', 'tone_hard', 'tone_superhard'][
                  Number(e.target.value)
                ] as CoachToneId,
              )
            }
            disabled={!editable}
            className="w-40"
          />
          <span className="mt-1 text-sm">
            {
              {
                tone_soft: 'Soft',
                tone_medium: 'Medium',
                tone_hard: 'Hard',
                tone_superhard: 'Superhard',
              }[tone]
            }
          </span>
        </div>
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
