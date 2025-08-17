'use client';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import type { Flavor, Visibility } from '@/types/flavor';
import { createFlavor as createFlavorAction, updateFlavor as updateFlavorAction } from './actions';

const ICONS = ['⭐', '❤️', '🌞', '🌙', '📚'];
const VISIBILITIES: Visibility[] = ['private', 'friends', 'followers', 'public'];

function sortFlavors(list: Flavor[]) {
  return [...list].sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export default function FlavorsClient({
  userId,
  initialFlavors,
}: {
  userId: string;
  initialFlavors: Flavor[];
}) {
  const [flavors, setFlavors] = useState<Flavor[]>(sortFlavors(initialFlavors));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Flavor | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#888888',
    icon: ICONS[0],
    importance: 50,
    targetMix: 50,
    visibility: 'private' as Visibility,
    orderIndex: 0,
  });
  const initialForm = useRef(form);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm.current);

  function openCreate(e: React.MouseEvent<HTMLButtonElement>) {
    triggerRef.current = e.currentTarget;
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
    initialForm.current = blank;
    setModalOpen(true);
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  function openEdit(f: Flavor, el: HTMLElement) {
    triggerRef.current = el;
    const data = {
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
    setForm(data);
    initialForm.current = data;
    setModalOpen(true);
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  const requestClose = useCallback(() => {
    if (isDirty && !confirm('Discard changes?')) return;
    setModalOpen(false);
    setError('');
    setTimeout(() => triggerRef.current?.focus(), 0);
  }, [isDirty]);

  useEffect(() => {
    if (!modalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        requestClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen, requestClose]);

  useEffect(() => {
    if (!modalOpen) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])'
    );
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [modalOpen]);

  useEffect(() => {
    if (!descRef.current) return;
    descRef.current.style.height = 'auto';
    const line = parseInt(getComputedStyle(descRef.current).lineHeight || '20', 10);
    const max = line * 8;
    descRef.current.style.height = Math.min(descRef.current.scrollHeight, max) + 'px';
  }, [form.description]);

  const onBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        requestClose();
      }
    },
    [requestClose]
  );

  function save() {
    setError('');
    const action = editing
      ? (data: typeof form) => updateFlavorAction(editing.id, data)
      : (data: typeof form) => createFlavorAction(data);
    startTransition(async () => {
      try {
        const data = await action(form);
        setFlavors((prev) =>
          sortFlavors(
            editing ? prev.map((p) => (p.id === data.id ? data : p)) : [...prev, data]
          )
        );
        setModalOpen(false);
        setError('');
        initialForm.current = form;
        setTimeout(() => triggerRef.current?.focus(), 0);
      } catch (e: any) {
        setError(e.message || 'Failed to save');
        setTimeout(() => {
          nameRef.current?.focus();
        }, 0);
      }
    });
  }

  async function remove(f: Flavor) {
    if (!confirm(`Delete '${f.name}'? This can't be undone.`)) return;
    const res = await fetch(`/api/flavors/${f.id}`, { method: 'DELETE' });
    if (res.ok) {
      setFlavors((prev) => prev.filter((p) => p.id !== f.id));
    }
  }

  const descCount = form.description.length;

  return (
    <section>
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreate}
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
            onClick={(e) => openEdit(f, e.currentTarget as HTMLElement)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') openEdit(f, e.currentTarget as HTMLElement);
              if (e.key === 'Delete') remove(f);
            }}
            className="flex items-center gap-4 p-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
          >
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
            <div className="ml-auto flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                id={`f7avoured1t${f.id}-${userId}`}
                className="text-sm text-blue-600 underline"
                onClick={(e) => openEdit(f, e.currentTarget as HTMLElement)}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md"
          onMouseDown={onBackdrop}
        >
          <div
            ref={modalRef}
            id={`f7avourmdl-${editing ? 'edit' : 'new'}-${userId}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="flavor-modal-title"
            className="mx-4 w-full max-w-[800px] rounded-3xl bg-white p-6 shadow-xl transition-all duration-150 data-[open=false]:scale-95 data-[open=false]:opacity-0"
          >
            <h2 id="flavor-modal-title" className="mb-4 text-lg font-semibold">
              {editing ? 'Edit Flavor' : 'New Flavor'}
            </h2>
            <div className="mb-4 flex justify-center">
              <div
                style={{
                  '--importance': form.importance,
                  '--diam': `clamp(44px, calc(28px + 0.8px * var(--importance)), 120px)`,
                  backgroundColor: form.color,
                  width: 'var(--diam)',
                  height: 'var(--diam)',
                } as React.CSSProperties}
                className="flex items-center justify-center rounded-full shadow-inner"
              >
                <span className="text-white" style={{ fontSize: 'min(44px, calc(var(--diam)*0.48))' }}>
                  {form.icon}
                </span>
              </div>
            </div>
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div className="col-span-1">
                <label className="block text-sm font-medium" htmlFor={`f7avourn4me-frm-${userId}`}>
                  Name
                </label>
                <input
                  ref={nameRef}
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
                <label className="block text-sm font-medium" htmlFor={`f7avourde5cr-frm-${userId}`}>
                  Description
                </label>
                <textarea
                  ref={descRef}
                  id={`f7avourde5cr-frm-${userId}`}
                  className="w-full resize-none rounded border p-1"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 280) })}
                  maxLength={280}
                  rows={4}
                />
                <div className="mt-1 text-right text-xs">
                  <span className={descCount >= 280 ? 'text-gray-400' : 'text-gray-500'}>
                    {descCount}/280
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Color</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Icon</label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                >
                  {ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor={`f7avour1mp-frm-${userId}`}>
                  Importance
                </label>
                <input
                  id={`f7avour1mp-frm-${userId}`}
                  type="range"
                  min={0}
                  max={100}
                  value={form.importance}
                  onChange={(e) => setForm({ ...form, importance: Number(e.target.value) })}
                />
                <span className="ml-2 text-sm">{form.importance}</span>
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor={`f7avourt4rg-frm-${userId}`}>
                  Target %
                </label>
                <input
                  id={`f7avourt4rg-frm-${userId}`}
                  type="number"
                  min={0}
                  max={100}
                  value={form.targetMix}
                  onChange={(e) =>
                    setForm({ ...form, targetMix: Math.max(0, Math.min(100, Number(e.target.value))) })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value as Visibility })}
                >
                  {VISIBILITIES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 mt-4 flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  id={`f7avourcnl-frm-${userId}`}
                  className="rounded border px-3 py-1"
                  onClick={requestClose}
                >
                  Cancel
                </button>
                <button
                  id={`f7avoursav-frm-${userId}`}
                  type="submit"
                  disabled={isPending}
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
