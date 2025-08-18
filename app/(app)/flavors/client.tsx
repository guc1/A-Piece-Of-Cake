'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Flavor, Visibility } from '@/types/flavor';
import { createFlavor, updateFlavor } from './actions';

const ICONS = ['⭐', '❤️', '🌞', '🌙', '📚'];
const VISIBILITIES: Visibility[] = ['private', 'friends', 'followers', 'public'];
const COLOR_SWATCHES = ['#f87171', '#f97316', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6'];

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

interface FlavorsClientProps {
  userId: string;
  initialFlavors: Flavor[];
  readOnly?: boolean;
}

export default function FlavorsClient({
  userId,
  initialFlavors,
  readOnly = false,
}: FlavorsClientProps) {
  if (readOnly) {
    return <ReadOnlyFlavors userId={userId} flavors={initialFlavors} />;
  }
  return <EditableFlavors userId={userId} initialFlavors={initialFlavors} />;
}

function ReadOnlyFlavors({
  userId,
  flavors,
}: {
  userId: string;
  flavors: Flavor[];
}) {
  return (
    <section>
      <ul className="flex flex-col gap-4" id={`f7avourli5t-${userId}`}>
        {flavors.map((f) => (
          <li key={f.id} className="flex items-center gap-4 p-2">
            <div
              aria-label={`${f.name} flavor`}
              style={{
                '--importance': f.importance,
                '--diam': `clamp(44px, calc(28px + 0.8px * var(--importance)), 120px)`,
                backgroundColor: f.color,
                width: 'var(--diam)',
                height: 'var(--diam)',
              } as React.CSSProperties}
              className="flex items-center justify-center rounded-full shadow-inner"
            >
              <span
                className="text-white"
                style={{ fontSize: 'min(44px, calc(var(--diam)*0.48))' }}
              >
                {f.icon}
              </span>
            </div>
            <div>
              <p className="font-semibold">{f.name}</p>
              {f.description && (
                <p className="text-sm text-muted-foreground">{f.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EditableFlavors({
  userId,
  initialFlavors,
}: {
  userId: string;
  initialFlavors: Flavor[];
}) {
  const router = useRouter();
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
    const lineHeight = 24;
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
              if (e.key === 'Enter') openEdit(f, e.currentTarget as HTMLElement);
              if (e.key === 'Delete') remove(f);
            }}
            className="flex items-center gap-4 p-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
          >
            <div className="flex flex-col items-center">
              <div
                id={`f7avourava${f.id}-${userId}`}
                aria-label={`${f.name} flavor, importance ${f.importance}, target ${f.targetMix} percent, ${f.visibility}`}
                title={`Importance: ${f.importance} • Target: ${f.targetMix}%`}
                style={{
                  '--importance': f.importance,
                  '--diam': `clamp(44px, calc(28px + 0.8px * var(--importance)), 120px)`,
                  backgroundColor: f.color,
                  width: 'var(--diam)',
                  height: 'var(--diam)',
                } as React.CSSProperties}
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
                  router.push(`/flavors/${f.id}/subflavors`);
                }}
              >
                View Subflavors
              </button>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{f.name}</h3>
              {f.description && (
                <p className="text-sm text-muted-foreground">{f.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {modalOpen && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="w-full max-w-md rounded bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {mode === 'edit' ? 'Edit Flavor' : 'New Flavor'}
            </h2>
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="w-full rounded border px-2 py-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="w-full resize-none rounded border px-2 py-1"
                value={form.description}
                onChange={handleDescription}
              />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="color">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: c }}
                      aria-label={c}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="icon">
                  Icon
                </label>
                <div className="flex items-center gap-2">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      className="h-6 w-6"
                      onClick={() => setForm({ ...form, icon: ic })}
                      aria-label={ic}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="importance">
                  Importance
                </label>
                <input
                  id="importance"
                  type="range"
                  min={0}
                  max={100}
                  value={form.importance}
                  onChange={(e) =>
                    setForm({ ...form, importance: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="targetMix">
                  Target Mix
                </label>
                <input
                  id="targetMix"
                  type="range"
                  min={0}
                  max={100}
                  value={form.targetMix}
                  onChange={(e) =>
                    setForm({ ...form, targetMix: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium" htmlFor="visibility">
                Visibility
              </label>
              <select
                id="visibility"
                className="w-full rounded border px-2 py-1"
                value={form.visibility}
                onChange={(e) =>
                  setForm({ ...form, visibility: e.target.value as Visibility })
                }
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1"
                onClick={attemptClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-orange-500 px-3 py-1 text-white"
                onClick={save}
                disabled={submitting}
              >
                {mode === 'edit' ? 'Save' : 'Create'}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

