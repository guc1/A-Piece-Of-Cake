'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { COACH_TONES, CUSTOM_COACH_TEMPLATE } from '@/lib/ai/coach-tone';
import type { ReviewExtraTimeRecord } from '@/lib/review-extra-time-store';
import { cn } from '@/lib/utils';

export default function AccountSettingsPage() {
  const { editable } = useViewContext();
  const router = useRouter();
  const [visibility, setVisibility] = useState<'open' | 'closed' | 'private'>('open');
  const [coachTone, setCoachTone] = useState('tone_medium');
  const [toneLoaded, setToneLoaded] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [extraTime, setExtraTime] = useState<ReviewExtraTimeRecord | null>(null);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraReason, setExtraReason] = useState('');
  const [activating, setActivating] = useState(false);
  const [extraError, setExtraError] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle',
  );
  const [formError, setFormError] = useState<string | null>(null);
  const trimmedCustom = customInstructions.trim();
  const wordCount = trimmedCustom ? trimmedCustom.split(/\s+/).filter(Boolean).length : 0;
  const customTooLong = wordCount > 250;
  const requiresCustom = coachTone === 'tone_custom';
  const disableSave =
    saving ||
    !editable ||
    !toneLoaded ||
    (requiresCustom && !trimmedCustom) ||
    customTooLong;
  useEffect(() => {
    fetch('/api/account/visibility')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setVisibility(data?.accountVisibility ?? 'open'));
    fetch('/api/account/coach-tone')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setCoachTone(data?.coachTone ?? 'tone_medium');
        setCustomInstructions(
          typeof data?.customInstructions === 'string'
            ? data.customInstructions
            : '',
        );
        setToneLoaded(true);
      })
      .catch(() => {
        setCustomInstructions('');
        setToneLoaded(true);
      });
    fetch('/api/account/review-extra-time')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setExtraTime(data?.reviewExtraTime ?? null))
      .catch(() => setExtraTime(null));
  }, []);

  async function save() {
    resetStatus();
    if (!toneLoaded) return;
    if (requiresCustom && !trimmedCustom) {
      setFormError('Please describe how you want your custom coach to behave.');
      return;
    }
    if (customTooLong) {
      setFormError('Custom coach instructions must be 250 words or fewer.');
      return;
    }
    setFormError(null);
    setSaving(true);
    setStatusType('saving');
    setStatusMessage('Saving…');
    try {
      const visibilityPromise = fetch('/api/account/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountVisibility: visibility }),
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : 'Unable to update visibility.',
          );
        }
      });
      const tonePromise = fetch('/api/account/coach-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachTone,
          customInstructions: trimmedCustom,
        }),
      }).then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : 'Unable to update coach tone.',
          );
        }
        setCoachTone(data?.coachTone ?? coachTone);
        setCustomInstructions(
          typeof data?.customInstructions === 'string'
            ? data.customInstructions
            : trimmedCustom,
        );
      });
      await Promise.all([visibilityPromise, tonePromise]);
      setStatusType('success');
      setStatusMessage('Completed!');
      window.setTimeout(() => {
        router.back();
      }, 650);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save account settings.';
      setStatusType('error');
      setStatusMessage(message);
    } finally {
      setSaving(false);
    }
  }

  function resetStatus() {
    setStatusType('idle');
    setStatusMessage(null);
  }

  async function activateExtraTime() {
    const reason = extraReason.trim();
    if (!reason) {
      setExtraError('Please share your reason for extending the review window.');
      return;
    }
    setActivating(true);
    setExtraError('');
    try {
      const res = await fetch('/api/account/review-extra-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setExtraError(data?.error ?? 'Unable to activate extra time.');
        setActivating(false);
        return;
      }
      const data = await res.json().catch(() => null);
      setExtraTime(data?.reviewExtraTime ?? null);
      setExtraReason('');
      setShowExtraModal(false);
      setActivating(false);
      if (typeof window !== 'undefined') {
        window.setTimeout(() => window.location.reload(), 150);
      }
    } catch (error) {
      console.error('activate extra time failed', error);
      setExtraError('Unable to activate extra time.');
      setActivating(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Account Settings</h1>
      <label className="flex items-center justify-between">
        <span>Account visibility</span>
        <select
          value={visibility}
          onChange={(e) => {
            resetStatus();
            setVisibility(e.target.value as 'open' | 'closed' | 'private');
          }}
          disabled={!editable}
          className="rounded border px-2 py-1"
        >
          <option value="open">open</option>
          <option value="closed">closed</option>
          <option value="private">private</option>
        </select>
      </label>
      <div>
        <label className="flex items-center justify-between">
          <span>Coach tone</span>
          <select
            value={toneLoaded ? coachTone : ''}
            onChange={(e) => {
              resetStatus();
              setFormError(null);
              setCoachTone(e.target.value);
            }}
            disabled={!editable || !toneLoaded}
            className="rounded border px-2 py-1"
          >
            {!toneLoaded && (
              <option value="" disabled>
                Loading…
              </option>
            )}
            {COACH_TONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-sm text-neutral-600">
          Choose the tone your AI coach should use when scoring your reports.
        </p>
      </div>
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-orange-600">Custom coach</h2>
            <p className="text-sm text-orange-800/80">
              Write specific instructions for your coach. When you select the
              custom tone above, these notes replace the presets everywhere in the
              app.
            </p>
          </div>
          <button
            type="button"
            onClick={
              editable
                ? () => {
                    resetStatus();
                    setFormError(null);
                    setCustomInstructions(CUSTOM_COACH_TEMPLATE);
                  }
                : undefined
            }
            disabled={!editable}
            className="rounded-full border border-orange-300 px-3 py-1 text-sm font-medium text-orange-700 transition hover:bg-orange-100 disabled:opacity-40"
          >
            Use template
          </button>
        </div>
        <textarea
          value={customInstructions}
          onChange={(e) => {
            resetStatus();
            if (formError) setFormError(null);
            setCustomInstructions(e.target.value);
          }}
          readOnly={!editable}
          disabled={!toneLoaded}
          className="mt-3 h-40 w-full resize-none rounded border border-orange-200 bg-white p-3 text-sm text-neutral-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="Describe exactly how your coach should coach you."
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={customTooLong ? 'text-red-600' : 'text-orange-700'}>
            {wordCount}/250 words
          </span>
          {formError && <span className="text-red-600">{formError}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={editable ? save : undefined}
          disabled={disableSave}
          className="flex items-center gap-2 rounded bg-[var(--accent)] px-4 py-1 text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          Save
        </button>
        {statusMessage && (
          <span
            role="status"
            aria-live="polite"
            className={cn(
              'text-sm',
              statusType === 'success'
                ? 'text-green-600'
                : statusType === 'error'
                  ? 'text-red-600'
                  : 'text-neutral-600',
            )}
          >
            {statusMessage}
          </span>
        )}
      </div>
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-orange-600">
              12H extra review time
            </h2>
            <p className="text-sm text-neutral-700">
              Freeze your review window until noon tomorrow when you know you’ll
              finish late. Your review score still counts for the day you froze.
            </p>
            {extraTime && (
              <p className="mt-2 text-xs text-orange-600">
                {extraTime.active ? 'Currently active' : 'Last used'} for{' '}
                {extraTime.frozenDate
                  ? new Date(`${extraTime.frozenDate}T00:00:00`).toLocaleDateString(
                      'en-GB',
                      { dateStyle: 'medium' },
                    )
                  : 'a previous day'}
                .
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={editable ? () => setShowExtraModal(true) : undefined}
            disabled={!editable || activating}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold text-white shadow transition',
              editable
                ? 'bg-gradient-to-r from-orange-500 to-orange-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300'
                : 'bg-zinc-400 opacity-60',
            )}
          >
            12H extra time
          </button>
        </div>
      </div>
      {showExtraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-orange-600">
              Why do you need the extra 12 hours?
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Capture a quick note for yourself and others about why you’re
              extending the review window.
            </p>
            <textarea
              value={extraReason}
              onChange={(e) => setExtraReason(e.target.value)}
              disabled={activating}
              className="mt-4 h-32 w-full resize-none rounded border border-orange-200 bg-orange-50 p-3 text-sm text-neutral-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="Because I finished work at 01:00 and still want to reflect on today…"
            />
            {extraError && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {extraError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activating) return;
                  setShowExtraModal(false);
                  setExtraError('');
                }}
                className="rounded px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={activateExtraTime}
                disabled={activating}
                className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-400 disabled:opacity-60"
              >
                {activating ? 'Activating…' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
