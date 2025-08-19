'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Flavor, Visibility, FlavorInput } from '@/types/flavor';
import { createFlavor, updateFlavor, copyFlavor } from './actions';
import type { PeopleLists, Person } from '@/lib/people-store';
import { useViewContext } from '@/lib/view-context';
import { hrefFor } from '@/lib/navigation';
import IconPicker from '@/components/icon-picker';
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

const PRESET_FLAVORS: FlavorInput[] = [
  {
    name: 'Health',
    description: 'Care for body and mind',
    color: '#f97316',
    icon: '❤️',
    importance: 70,
    targetMix: 50,
    visibility: 'private',
    orderIndex: 0,
    slug: '',
  },
  {
    name: 'Learning',
    description: 'Continuous growth and study',
    color: '#60a5fa',
    icon: '📚',
    importance: 60,
    targetMix: 40,
    visibility: 'private',
    orderIndex: 0,
    slug: '',
  },
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
  selfId,
  initialFlavors,
  people,
}: {
  userId: string;
  selfId?: string;
  initialFlavors: Flavor[];
  people?: PeopleLists;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ctx = useViewContext();
  const { editable } = ctx;
  const [flavors, setFlavors] = useState<Flavor[]>(sortFlavors(initialFlavors));
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<'choice' | 'preset' | 'search'>(
    'choice',
  );
  const [peopleSearch, setPeopleSearch] = useState('');
  const [editing, setEditing] = useState<Flavor | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    color: '#888888',
    icon: '⭐',
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
  const filtered = useMemo(
    () =>
      flavors.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase()),
      ),
    [flavors, search],
  );

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    initialFormRef.current = initialForm;
  }, [initialForm]);

  const mode = editing ? 'edit' : 'new';

  async function importPreset(p: FlavorInput) {
    const created = await createFlavor(p);
    setFlavors((prev) => sortFlavors([...prev, created]));
    setImportOpen(false);
    setImportMode('choice');
  }

  function filterPeople(list: Person[] | undefined) {
    if (!list) return [];
    const q = peopleSearch.toLowerCase();
    return list.filter(
      (p) =>
        p.handle.toLowerCase().includes(q) ||
        (p.displayName ? p.displayName.toLowerCase().includes(q) : false),
    );
  }

  const categories = [
    { label: 'Friends', list: filterPeople(people?.friends) },
    { label: 'Following', list: filterPeople(people?.following) },
    { label: 'Others', list: filterPeople(people?.others) },
  ];

  function openNew() {
    if (!editable) return;
    triggerRef.current = null;
    const blank = {
      name: '',
      description: '',
      color: '#888888',
      icon: '⭐',
      importance: 50,
      targetMix: 50,
      visibility: 'private' as Visibility,
      orderIndex: flavors.length,
    };
    setForm(blank);
    setInitialForm(blank);
    setEditing(null);
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
    if (!editable) return;
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
      <div className="mb-4 flex items-center gap-4">
        <button
          id={`f7av-add-${userId}`}
          onClick={() => editable && setChoiceOpen(true)}
          disabled={!editable}
          className="rounded bg-orange-500 px-3 py-2 text-white disabled:opacity-50"
        >
          + Add flavor
        </button>
        <input
          type="text"
          placeholder="Search flavors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded border px-2 py-1"
        />
      </div>
      <ul className="flex flex-col gap-4" id={`f7avourli5t-${userId}`}>
        {filtered.map((f) => (
          <li
            key={f.id}
            id={`f7avourrow${f.id}-${userId}`}
            role="button"
            tabIndex={0}
            onClick={(e) => openEdit(f, e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')
                openEdit(f, e.currentTarget as HTMLElement);
              if (editable && e.key === 'Delete') remove(f);
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
                  {f.icon.startsWith('data:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.icon}
                      alt="icon"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    f.icon
                  )}
                </span>
              </div>
              <button
                id={`f7avsubfbtn${f.id}-${userId}`}
                className="mt-2 text-xs text-blue-600 underline"
                onClick={(e) => {
                  e.stopPropagation();
                  const base = editable
                    ? `/flavors/${f.id}/subflavors`
                    : hrefFor(`/flavors/${f.id}/subflavors`, ctx);
                  const target = searchParams.get('to');
                  const href = target ? `${base}?to=${target}` : base;
                  router.push(href);
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
                className="text-sm text-blue-600 underline disabled:opacity-50"
                onClick={
                  editable ? (e) => openEdit(f, e.currentTarget) : undefined
                }
                disabled={!editable}
              >
                Edit ▸
              </button>
              <button
                id={`f7avourd3l${f.id}-${userId}`}
                className="text-sm text-red-600 underline disabled:opacity-50"
                onClick={editable ? () => remove(f) : undefined}
                disabled={!editable}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {choiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Add flavor</h2>
            <div className="flex flex-col gap-2">
              <button
                id={`f7av-add-own-${userId}`}
                className="rounded bg-orange-500 px-3 py-1 text-white"
                onClick={() => {
                  setChoiceOpen(false);
                  openNew();
                }}
              >
                Create own flavor
              </button>
              <button
                id={`f7av-add-import-${userId}`}
                className="rounded bg-orange-500 px-3 py-1 text-white"
                onClick={() => {
                  setChoiceOpen(false);
                  setImportMode('choice');
                  setImportOpen(true);
                }}
              >
                Import flavor
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded border px-3 py-1"
                onClick={() => setChoiceOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded bg-white p-6 shadow-lg">
            {importMode === 'choice' && (
              <>
                <h2 className="mb-4 text-xl font-semibold">Import flavor</h2>
                <div className="flex flex-col gap-2">
                  <button
                    id={`f7av-imp-pre-${userId}`}
                    className="rounded bg-orange-500 px-3 py-1 text-white"
                    onClick={() => setImportMode('preset')}
                  >
                    Choose a preset
                  </button>
                  <button
                    id={`f7av-imp-srch-${userId}`}
                    className="rounded bg-orange-500 px-3 py-1 text-white"
                    onClick={() => setImportMode('search')}
                  >
                    Search what others have
                  </button>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => setImportOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {importMode === 'preset' && (
              <>
                <h2 className="mb-4 text-xl font-semibold">Choose a preset</h2>
                <div className="flex flex-col gap-2">
                  {PRESET_FLAVORS.map((p, idx) => (
                    <button
                      key={idx}
                      id={`f7av-pr3-${idx}-${userId}`}
                      className="rounded border p-2 text-left hover:bg-gray-50"
                      onClick={() => importPreset(p)}
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-gray-600">
                        {p.description}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => setImportMode('choice')}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => setImportOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {importMode === 'search' && (
              <>
                <h2 className="mb-4 text-xl font-semibold">Search people</h2>
                <input
                  type="text"
                  id={`f7av-ppl-srch-${userId}`}
                  placeholder="Search users…"
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  className="mb-4 w-full rounded border px-2 py-1"
                />
                <div className="max-h-64 overflow-y-auto space-y-4">
                  {categories.map((c) => (
                    <div key={c.label}>
                      <h3 className="font-semibold">{c.label}</h3>
                      {c.list.length === 0 ? (
                        <p className="text-sm text-gray-500">No users.</p>
                      ) : (
                        <ul className="divide-y">
                          {c.list.map((u) => (
                            <li key={u.id} className="py-2">
                              <a
                                id={`f7av-ppl-${u.id}-${userId}`}
                                href={`/view/${u.viewId}/flavors${searchParams.get('to') ? `?to=${searchParams.get('to')}` : ''}`}
                                className="block"
                              >
                                {u.displayName ?? u.handle}{' '}
                                <span className="text-sm text-gray-600">
                                  @{u.handle}
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => setImportMode('choice')}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => setImportOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
                  {form.icon.startsWith('data:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.icon}
                      alt="icon"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    form.icon
                  )}
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
                <IconPicker
                  value={form.icon}
                  onChange={(icon) => setForm({ ...form, icon })}
                />
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
                  disabled={submitting || !editable}
                  className="rounded bg-orange-500 px-3 py-1 text-white disabled:opacity-50"
                >
                  Save
                </button>
                {!editable && selfId && editing && (
                  <button
                    type="button"
                    className="rounded bg-orange-500 px-3 py-1 text-white"
                    onClick={async () => {
                      let withSubs = false;
                      try {
                        const res = await fetch(
                          `/api/public-subflavors?userId=${userId}&flavorId=${editing.id}`,
                        );
                        const subs = await res.json();
                        if (Array.isArray(subs) && subs.length > 0) {
                          withSubs = confirm('Also copy the subflavors?');
                        }
                      } catch {}
                      await copyFlavor(userId, editing.id, withSubs);
                      alert('Copied');
                    }}
                  >
                    Copy flavor
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
