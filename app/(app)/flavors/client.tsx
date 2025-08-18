'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useViewContext } from '@/lib/view-context';
import { hrefFor } from '@/lib/navigation';
import type { Flavor, Visibility } from '@/types/flavor';
import { createFlavor, updateFlavor } from './actions';

const ICONS = ['⭐', '❤️', '🌞', '🌙', '📚'];
const VISIBILITIES: Visibility[] = [
  'private',
  'friends',
  'followers',
  'public',
];
const COLOR_SWATCHES = [
  '#f87171',
  '#f97316',
  '#4ade80',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
];

function sortFlavors(list: Flavor[]) {
  return [...list].sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

type FormState = {
  name: string;
  description: string;
  color: string;
  icon: string;
  importance: number;
  targetMix: number;
  visibility: Visibility;
  orderIndex: number;
};

export default function FlavorsClient({
  userId,
  initialFlavors,
}: {
  userId: string;
  initialFlavors: Flavor[];
}) {
  const router = useRouter();
  const ctx = useViewContext();
  const [flavors, setFlavors] = useState<Flavor[]>(sortFlavors(initialFlavors));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Flavor | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    color: '#888888',
    icon: ICONS[0],
    importance: 50,
    targetMix: 50,
    visibility: 'private',
    orderIndex: 0,
  });
  const [initialForm, setInitialForm] = useState<FormState>(form);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const triggerRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef(form);
  const initialFormRef = useRef(initialForm);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    initialFormRef.current = initialForm;
  }, [initialForm]);

  const mode = editing ? 'edit' : 'new';

  function openCreate(e: HTMLElement) {
    triggerRef.current = e;
    setEditing(null);
    const blank = {
      name: '',
      description: '',
      color: '#888888',
      icon: ICONS[0],
      importance: 50,
      targetMix: 50,
      visibility: 'private' as Visibility,
      orderIndex: flavors.length,
    };
    setForm(blank);
    setInitialForm(blank);
    setModalOpen(true);
  }

  function openEdit(f: Flavor, e: HTMLElement) {
    triggerRef.current = e;
    const current = {
      name: f.name,
      description: f.description,
      color: f.color,
      icon: f.icon,
      importance: f.importance,
      targetMix: f.targetMix,
      visibility: f.visibility,
      orderIndex: f.orderIndex,
    };
    setEditing(f);
    setForm(current);
    setInitialForm(current);
    setModalOpen(true);
  }

  async function remove(f: Flavor) {
    if (!confirm(`Delete '${f.name}'? This can't be undone.`)) return;
    await fetch(`/api/flavors/${f.id}`, { method: 'DELETE' });
    setFlavors((prev) => prev.filter((p) => p.id !== f.id));
  }

  const attemptClose = useCallback(() => {
    const dirty =
      JSON.stringify(formRef.current) !==
      JSON.stringify(initialFormRef.current);
    if (dirty && !confirm('Discard changes?')) {
      return;
    }
    setModalOpen(false);
    setEditing(null);
    setError('');
    triggerRef.current?.focus();
  }, []);

  async function save() {
    setSubmitting(true);
    setError('');
    try {
      const data = editing
        ? await updateFlavor(editing.id, form)
        : await createFlavor(form);
      if (editing) {
        setFlavors((prev) =>
          sortFlavors(prev.map((p) => (p.id === data.id ? data : p))),
        );
      } else {
        setFlavors((prev) => sortFlavors([...prev, data]));
      }
      setModalOpen(false);
      setEditing(null);
      triggerRef.current?.focus();
    } catch (e: any) {
      setError(e.message || 'Error saving');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!modalOpen) return;
    const first = modalRef.current?.querySelector<HTMLElement>(
      'input, textarea, select, button',
    );
    first?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        attemptClose();
      }
      if (e.key === 'Tab') {
        const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
          'input, textarea, select, button:not([disabled])',
        );
        if (!focusables || focusables.length === 0) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [modalOpen, attemptClose]);

  function handleDescription(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value.slice(0, 280);
    setForm({ ...form, description: text });
    e.target.style.height = 'auto';
    const lineHeight = 24; // approx tailwind leading-tight ~1.25rem
    const max = lineHeight * 8;
    const newHeight = Math.min(e.target.scrollHeight, max);
    e.target.style.height = newHeight + 'px';
  }

  return (
    <section>
      <div className="mb-4 flex justify-end">
        <button
          onClick={(e) => openCreate(e.currentTarget)}
          className="rounded bg-orange-500 px-3 py-2 text-white"
          id={`f7avoured1tnew-${userId}`}
        >
          New Flavor
        </button>
      </div>
      <ul className="flex flex-col gap-4" id={`f7avourli5t-${userId}`}>
        {flavors.map((f) => (
          <li
            key={f.id}
            id={`f7avourrow${f.id}-${userId}`}
            role="button"
            tabIndex={0}
            onClick={(e) => openEdit(f, e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')
                openEdit(f, e.currentTarget as HTMLElement);
              if (e.key === 'Delete') remove(f);
            }}
            className="flex items-center gap-4 p-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
          >
            <div className="flex flex-col items-center">
              <div
                id={`f7avourava${f.id}-${userId}`}
                aria-label={`${f.name} flavor, importance ${f.importance}, target ${f.targetMix} percent, ${f.visibility}`}
                title={`Importance: ${f.importance} • Target: ${f.targetMix}%`}
                style={
                  {
                    '--importance': f.importance,
                    '--diam': `clamp(44px, calc(28px + 0.8px * var(--importance)), 120px)`,
                    backgroundColor: f.color,
                    width: 'var(--diam)',
                    height: 'var(--diam)',
                  } as React.CSSProperties
                }
                className="flex items-center justify-center rounded-full shadow-inner"
              >
                <span
                  className="text-white"
                  style={{ fontSize: 'min(44px, calc(var(--diam)*0.48))' }}
                >
                  {f.icon}
                </span>
              </div>
              <button
                id={`f7avsubfbtn${f.id}-${userId}`}
                className="mt-2 text-xs text-blue-600 underline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(hrefFor(`/flavors/${f.id}/subflavors`, ctx));
                }}
              >
                View Subflavors
              </button>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div
                id={`f7avourn4me${f.id}-${userId}`}
                className="font-semibold"
                style={{ color: '#000' }}
              >
                {f.name}
              </div>
              <div
                id={`f7avourde5cr${f.id}-${userId}`}
                className="text-sm text-gray-500"
              >
                {f.description}
              </div>
              <div className="mt-1 flex gap-2 text-xs text-gray-400">
                <span>Target {f.targetMix}%</span>
                <span>{f.visibility}</span>
              </div>
            </div>
            <div
              className="ml-auto flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                id={`f7avoured1t${f.id}-${userId}`}
                className="text-sm text-blue-600 underline"
                onClick={(e) => openEdit(f, e.currentTarget)}
              >
                Edit ▸
              </button>
              <button
                id={`f7avourd3l${f.id}-${userId}`}
                className="text-sm text-red-600 underline"
                onClick={() => remove(f)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {modalOpen && (
        <div
          id={`f7avourmdl-${mode}-${userId}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md"
          aria-modal="true"
          role="dialog"
          aria-labelledby="flavor-modal-title"
          onClick={attemptClose}
        >
          <div
            ref={modalRef}
            className="w-full max-w-[800px] rounded-3xl bg-white p-6 shadow-xl transform transition-all duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="flavor-modal-title" className="text-lg font-semibold">
                {editing ? 'Edit Flavor' : 'New Flavor'}
              </h2>
              <div
                style={
                  {
                    '--importance': form.importance,
                    '--diam': `clamp(44px, calc(28px + 0.8px * var(--importance)), 120px)`,
                    backgroundColor: form.color,
                    width: 'var(--diam)',
                    height: 'var(--diam)',
                  } as React.CSSProperties
                }
                className="flex items-center justify-center rounded-full shadow-inner"
              >
                <span
                  className="text-white"
                  style={{ fontSize: 'min(44px, calc(var(--diam)*0.48))' }}
                >
                  {form.icon}
                </span>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!submitting) save();
              }}
              className="grid gap-4 md:grid-cols-2"
            >
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor={`f7avourn4me-frm-${userId}`}
                >
                  Name
                </label>
                <input
                  id={`f7avourn4me-frm-${userId}`}
                  className="w-full rounded border p-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  minLength={2}
                  maxLength={40}
                />
              </div>
              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium"
                  htmlFor={`f7avourde5cr-frm-${userId}`}
                >
                  Description
                </label>
                <div className="relative">
                  <textarea
                    id={`f7avourde5cr-frm-${userId}`}
                    className="w-full resize-none overflow-hidden rounded border p-1"
                    value={form.description}
                    onChange={handleDescription}
                    maxLength={280}
                    rows={4}
                    style={{ height: 'auto' }}
                  />
                  <span
                    className={`absolute bottom-1 right-1 text-xs ${form.description.length === 280 ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {form.description.length}/280
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Color</label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-6 w-6 rounded-full border ${form.color === c ? 'ring-2 ring-black' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                  <input
                    name="color"
                    type="text"
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    className="w-24 rounded border p-1 text-sm"
                    placeholder="#RRGGBB"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setForm({ ...form, icon: ic })}
                      className={`flex h-8 w-8 items-center justify-center rounded border ${form.icon === ic ? 'bg-gray-200' : ''}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor={`f7avour1mp-frm-${userId}`}
                >
                  Importance
                </label>
                <input
                  id={`f7avour1mp-frm-${userId}`}
                  type="range"
                  min={0}
                  max={100}
                  value={form.importance}
                  onChange={(e) =>
                    setForm({ ...form, importance: Number(e.target.value) })
                  }
                />
                <span className="ml-2 text-sm">{form.importance}</span>
              </div>
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor={`f7avourt4rg-frm-${userId}`}
                >
                  Target %
                </label>
                <input
                  id={`f7avourt4rg-frm-${userId}`}
                  type="number"
                  min={0}
                  max={100}
                  value={form.targetMix}
                  onChange={(e) =>
                    setForm({ ...form, targetMix: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      visibility: e.target.value as Visibility,
                    })
                  }
                >
                  {VISIBILITIES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <div className="md:col-span-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="md:col-span-2 flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  id={`f7avourcnl-frm-${userId}`}
                  className="rounded border px-3 py-1"
                  onClick={attemptClose}
                >
                  Cancel
                </button>
                <button
                  id={`f7avoursav-frm-${userId}`}
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-orange-500 px-3 py-1 text-white disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
