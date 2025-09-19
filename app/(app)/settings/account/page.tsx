'use client';

import { useState, useEffect } from 'react';
import { useViewContext } from '@/lib/view-context';
import { COACH_TONES } from '@/lib/ai/coach-tone';

export default function AccountSettingsPage() {
  const { editable } = useViewContext();
  const [visibility, setVisibility] = useState<'open' | 'closed' | 'private'>('open');
  const [coachTone, setCoachTone] = useState('tone_medium');
  const [saving, setSaving] = useState(false);
  const [showExtraDialog, setShowExtraDialog] = useState(false);
  const [extraReason, setExtraReason] = useState('');
  const [extraError, setExtraError] = useState('');
  const [activatingExtra, setActivatingExtra] = useState(false);
  const [activationMessage, setActivationMessage] = useState('');
  useEffect(() => {
    fetch('/api/account/visibility')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setVisibility(data?.accountVisibility ?? 'open'));
    fetch('/api/account/coach-tone')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCoachTone(data?.coachTone ?? 'tone_medium'));
  }, []);

  async function save() {
    setSaving(true);
    await Promise.all([
      fetch('/api/account/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountVisibility: visibility }),
      }),
      fetch('/api/account/coach-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachTone }),
      }),
    ]);
    setSaving(false);
  }

  function openExtraDialog() {
    setExtraReason('');
    setExtraError('');
    setShowExtraDialog(true);
  }

  function closeExtraDialog() {
    if (activatingExtra) return;
    setShowExtraDialog(false);
  }

  async function activateExtraTime() {
    if (!editable) return;
    const reason = extraReason.trim();
    if (!reason) {
      setExtraError('Please tell us why you need the extra time.');
      return;
    }
    setActivatingExtra(true);
    setExtraError('');
    try {
      const res = await fetch('/api/review-extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setExtraError(data?.error || 'Unable to activate extra time.');
        return;
      }
      setShowExtraDialog(false);
      setExtraReason('');
      setActivationMessage(
        '12H extra time activated. Finish yesterday’s review before noon and the calendar will still turn green.',
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('review-extension:changed'));
      }
    } catch (err) {
      setExtraError('Unable to activate extra time.');
    } finally {
      setActivatingExtra(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Account Settings</h1>
      <label className="flex items-center justify-between">
        <span>Account visibility</span>
        <select
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value as 'open' | 'closed' | 'private')
          }
          disabled={!editable}
          className="rounded border px-2 py-1"
        >
          <option value="open">open</option>
          <option value="closed">closed</option>
          <option value="private">private</option>
        </select>
      </label>
      <label className="flex items-center justify-between">
        <span>Coach tone</span>
        <select
          value={coachTone}
          onChange={(e) => setCoachTone(e.target.value)}
          disabled={!editable}
          className="rounded border px-2 py-1"
        >
          {COACH_TONES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <div className="space-y-3 rounded-lg border border-[var(--review)]/40 bg-[var(--review)]/5 p-4">
        <h2 className="text-lg font-semibold text-[var(--review)]">
          Need 12H extra review time?
        </h2>
        <p className="text-sm text-neutral-700">
          Freeze yesterday’s review window until 12:00 the next day. Share your
          reason before activating so everyone understands the context.
        </p>
        <button
          type="button"
          onClick={editable ? openExtraDialog : undefined}
          disabled={!editable}
          className="rounded bg-[var(--review)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-50"
        >
          Activate 12H extra time
        </button>
        {activationMessage && (
          <p className="text-sm text-green-600">{activationMessage}</p>
        )}
      </div>
      <button
        onClick={editable ? save : undefined}
        disabled={saving || !editable}
        className="rounded bg-[var(--accent)] px-4 py-1 text-white hover:opacity-90 disabled:opacity-50"
      >
        Save
      </button>
      {showExtraDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="extra-time-heading"
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
          >
            <h2
              id="extra-time-heading"
              className="text-lg font-semibold text-[var(--review)]"
            >
              Why do you need 12H extra time?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              This note is visible to viewers so they know why the review window
              stayed open.
            </p>
            <textarea
              value={extraReason}
              onChange={(e) => setExtraReason(e.target.value)}
              disabled={activatingExtra}
              className="mt-4 h-40 w-full rounded border px-3 py-2 text-sm focus:outline-[var(--review)]"
              placeholder="Share what kept you past midnight, or why you’re finishing the review now."
            />
            {extraError && (
              <p className="mt-2 text-sm text-red-600">{extraError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeExtraDialog}
                disabled={activatingExtra}
                className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={activateExtraTime}
                disabled={activatingExtra}
                className="rounded bg-[var(--review)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-50"
              >
                {activatingExtra ? 'Activating…' : 'Activate extra time'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
