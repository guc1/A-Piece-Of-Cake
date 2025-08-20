'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import IconPicker from '@/components/icon-picker';
import type {
  Ingredient,
  Visibility,
  IngredientInput,
} from '@/types/ingredient';
import type { PeopleLists, Person } from '@/lib/people-store';
import { useViewContext } from '@/lib/view-context';
import {
  createIngredient as createAction,
  updateIngredient as updateAction,
  deleteIngredient as deleteAction,
} from './actions';

const VISIBILITIES: Visibility[] = [
  'private',
  'followers',
  'friends',
  'public',
];
const PRESET_INGREDIENTS: IngredientInput[] = [
  {
    title: 'Morning Run',
    shortDescription: 'Jog 20 minutes after waking',
    description: 'Start the day with a quick run to boost energy.',
    whyUsed: 'Improves health and mood.',
    whenUsed: 'Every morning before breakfast.',
    tips: 'Prepare clothes the night before.',
    usefulness: 70,
    icon: '🏃',
    imageUrl: null,
    tags: null,
    visibility: 'private',
  },
  {
    title: 'No Sugar After Lunch',
    shortDescription: 'Avoid sugary snacks in afternoon',
    description: 'Skip sugar to maintain energy levels.',
    whyUsed: 'Prevents afternoon crashes.',
    whenUsed: 'Every day after 12pm.',
    tips: 'Keep healthy snacks nearby.',
    usefulness: 60,
    icon: '🍬',
    imageUrl: null,
    tags: null,
    visibility: 'private',
  },
];

function iconSrc(ic: string) {
  if (ic.startsWith('data:')) return ic;
  if (/^[A-Za-z0-9+/=]+$/.test(ic)) return `data:image/png;base64,${ic}`;
  return null;
}

function sortIngredients(list: Ingredient[]) {
  return [...list].sort((a, b) => {
    if (b.usefulness !== a.usefulness) return b.usefulness - a.usefulness;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export default function IngredientsClient({
  userId,
  selfId,
  initialIngredients,
  people,
}: {
  userId: string; // owner id
  selfId?: string; // current viewer id for copy
  initialIngredients: Ingredient[];
  people?: PeopleLists;
}) {
  const ctx = useViewContext();
  const { editable } = ctx;
  const createMine = selfId
    ? createAction.bind(null, Number(selfId))
    : async () => {
        throw new Error('not allowed');
      };
  const updateMine = updateAction.bind(null, Number(userId));
  const deleteMine = deleteAction.bind(null, Number(userId));
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    sortIngredients(initialIngredients),
  );
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [open, setOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<'choice' | 'preset' | 'search'>(
    'choice',
  );
  const [peopleSearch, setPeopleSearch] = useState('');
  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    usefulness: 50,
    description: '',
    whyUsed: '',
    whenUsed: '',
    tips: '',
    icon: '⭐',
    visibility: 'private' as Visibility,
  });
  const initialForm = useRef(form);

  function openNew() {
    if (!editable) return;
    const blank = {
      title: '',
      shortDescription: '',
      usefulness: 50,
      description: '',
      whyUsed: '',
      whenUsed: '',
      tips: '',
      icon: '⭐',
      visibility: 'private' as Visibility,
    };
    setForm(blank);
    initialForm.current = blank;
    setEditing(null);
    setOpen(true);
  }

  function openEdit(i: Ingredient) {
    setEditing(i);
    const data = {
      title: i.title,
      shortDescription: i.shortDescription,
      usefulness: i.usefulness,
      description: i.description,
      whyUsed: i.whyUsed,
      whenUsed: i.whenUsed,
      tips: i.tips,
      icon: i.icon,
      visibility: i.visibility,
    };
    setForm(data);
    initialForm.current = data;
    setOpen(true);
  }

  async function save() {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v as any));
    if (editing) {
      const updated = await updateMine(editing.id, fd);
      if (updated) {
        setIngredients((prev) =>
          sortIngredients(prev.map((p) => (p.id === updated.id ? updated : p))),
        );
      }
    } else {
      const created = await createMine(fd);
      setIngredients((prev) => sortIngredients([...prev, created]));
    }
    setOpen(false);
  }

  async function remove(i: Ingredient) {
    if (!confirm('Delete ingredient?')) return;
    const ok = await deleteMine(i.id);
    if (ok) setIngredients((prev) => prev.filter((p) => p.id !== i.id));
    setOpen(false);
  }

  const filtered = useMemo(
    () =>
      ingredients.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.shortDescription.toLowerCase().includes(search.toLowerCase()),
      ),
    [ingredients, search],
  );

  function scoreColor(n: number) {
    if (n >= 70) return 'bg-green-200';
    if (n >= 40) return 'bg-yellow-200';
    return 'bg-gray-200';
  }

  async function importPreset(p: IngredientInput) {
    const fd = new FormData();
    Object.entries(p).forEach(([k, v]) => {
      if (v !== null && v !== undefined) {
        fd.append(k, String(v));
      }
    });
    const created = await createMine(fd);
    setIngredients((prev) => sortIngredients([...prev, created]));
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

  return (
    <section>
      <div className="mb-4 flex items-center gap-4">
        <button
          id={`1ngred-add-${userId}`}
          onClick={() => editable && setChoiceOpen(true)}
          disabled={!editable}
          className="rounded bg-orange-500 px-3 py-1 text-white disabled:opacity-50"
        >
          + Add ingredient
        </button>
        <input
          type="text"
          placeholder="Search ingredients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded border px-2 py-1"
        />
      </div>
      <div id={`1ngred-list-${userId}`} className="flex flex-col gap-4">
        {filtered.map((i) => (
          <div
            key={i.id}
            id={`1ngred-card-${i.id}-${userId}`}
            className="flex cursor-pointer items-center gap-4 rounded border p-4 shadow-sm"
            onClick={() => openEdit(i)}
          >
            <div
              id={`1ngred-card-img-${i.id}-${userId}`}
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-300"
            >
              {iconSrc(i.icon) ? (
                <img
                  src={iconSrc(i.icon) as string}
                  alt="icon"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl">{i.icon}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{i.title}</div>
              <div className="text-sm text-gray-600">{i.shortDescription}</div>
            </div>
            <div
              id={`1ngred-card-score-${i.id}-${userId}`}
              className={`${scoreColor(i.usefulness)} rounded-full px-2 py-1 text-sm`}
            >
              Score {i.usefulness}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p>No ingredients yet.</p>}
      </div>
      {choiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Add ingredient</h2>
            <div className="flex flex-col gap-2">
              <button
                id={`1ngred-add-own-${userId}`}
                className="rounded bg-orange-500 px-3 py-1 text-white"
                onClick={() => {
                  setChoiceOpen(false);
                  openNew();
                }}
              >
                Create own ingredient
              </button>
              <button
                id={`1ngred-add-import-${userId}`}
                className="rounded bg-orange-500 px-3 py-1 text-white"
                onClick={() => {
                  setChoiceOpen(false);
                  setImportMode('choice');
                  setImportOpen(true);
                }}
              >
                Import ingredient
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
                <h2 className="mb-4 text-xl font-semibold">
                  Import ingredient
                </h2>
                <div className="flex flex-col gap-2">
                  <button
                    id={`1ngred-imp-pre-${userId}`}
                    className="rounded bg-orange-500 px-3 py-1 text-white"
                    onClick={() => setImportMode('preset')}
                  >
                    Choose a preset
                  </button>
                  <button
                    id={`1ngred-imp-srch-${userId}`}
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
                  {PRESET_INGREDIENTS.map((p, idx) => (
                    <button
                      key={idx}
                      id={`1ngred-pr3-${idx}-${userId}`}
                      className="rounded border p-2 text-left hover:bg-gray-50"
                      onClick={() => importPreset(p)}
                    >
                      <div className="flex items-center gap-2">
                        {iconSrc(p.icon) ? (
                          <img
                            src={iconSrc(p.icon) as string}
                            alt="icon"
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">{p.icon}</span>
                        )}
                        <div>
                          <div className="font-semibold">{p.title}</div>
                          <div className="text-sm text-gray-600">
                            {p.shortDescription}
                          </div>
                        </div>
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
                  id={`1ngred-ppl-srch-${userId}`}
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
                              <Link
                                id={`1ngred-ppl-${u.id}-${userId}`}
                                href={`/view/${u.viewId}/ingredients`}
                                className="block"
                              >
                                {u.displayName ?? u.handle}{' '}
                                <span className="text-sm text-gray-600">
                                  @{u.handle}
                                </span>
                              </Link>
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
      {open && (
        <div
          id={`1ngred-modal-${editing ? editing.id : 'new'}-${userId}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded bg-white p-6 shadow-lg">
            <div className="mb-4 flex justify-between">
              <h2 className="text-xl font-semibold">
                {editing ? 'Edit ingredient' : 'New ingredient'}
              </h2>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            <div
              className="mb-4"
            >
              <label className="block text-sm font-medium">Icon</label>
              <IconPicker
                value={form.icon}
                onChange={(icon) => setForm({ ...form, icon })}
                people={people}
                editable={editable}
              />
            </div>
            <label
              className="block text-sm font-medium"
              htmlFor={`1ngred-t1tle-${editing ? editing.id : 'new'}-${userId}`}
            >
              Title
            </label>
            <input
              id={`1ngred-t1tle-${editing ? editing.id : 'new'}-${userId}`}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label
              className="block text-sm font-medium"
              htmlFor={`1ngred-sh0rt-${editing ? editing.id : 'new'}-${userId}`}
            >
              Short description
            </label>
            <input
              id={`1ngred-sh0rt-${editing ? editing.id : 'new'}-${userId}`}
              value={form.shortDescription}
              onChange={(e) =>
                setForm({ ...form, shortDescription: e.target.value })
              }
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label
              className="block text-sm font-medium"
              htmlFor={`1ngred-u53-${editing ? editing.id : 'new'}-${userId}`}
            >
              Usefulness ({form.usefulness})
            </label>
            <input
              id={`1ngred-u53-${editing ? editing.id : 'new'}-${userId}`}
              type="range"
              min={0}
              max={100}
              value={form.usefulness}
              onChange={(e) =>
                setForm({ ...form, usefulness: Number(e.target.value) })
              }
              disabled={!editable}
              className="mb-2 w-full"
            />
            <label
              className="block text-sm font-medium"
              htmlFor={`1ngred-de5c-${editing ? editing.id : 'new'}-${userId}`}
            >
              What it is
            </label>
            <textarea
              id={`1ngred-de5c-${editing ? editing.id : 'new'}-${userId}`}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label
              className="block text-sm font-medium"
              htmlFor={`1ngred-why-${editing ? editing.id : 'new'}-${userId}`}
            >
              Why used
            </label>
            <textarea
              id={`1ngred-why-${editing ? editing.id : 'new'}-${userId}`}
              value={form.whyUsed}
              onChange={(e) => setForm({ ...form, whyUsed: e.target.value })}
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label
              className="block text-sm font-medium"
              htmlFor={`1ngred-when-${editing ? editing.id : 'new'}-${userId}`}
            >
              When used / situations
            </label>
            <textarea
              id={`1ngred-when-${editing ? editing.id : 'new'}-${userId}`}
              value={form.whenUsed}
              onChange={(e) => setForm({ ...form, whenUsed: e.target.value })}
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label
              className="block text-sm font-medium"
              htmlFor={`1ngred-tips-${editing ? editing.id : 'new'}-${userId}`}
            >
              Tips
            </label>
            <textarea
              id={`1ngred-tips-${editing ? editing.id : 'new'}-${userId}`}
              value={form.tips}
              onChange={(e) => setForm({ ...form, tips: e.target.value })}
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label
              className="block text-sm font-medium"
              htmlFor={`1ngred-vis-${editing ? editing.id : 'new'}-${userId}`}
            >
              Visibility
            </label>
            <select
              id={`1ngred-vis-${editing ? editing.id : 'new'}-${userId}`}
              value={form.visibility}
              onChange={(e) =>
                setForm({ ...form, visibility: e.target.value as Visibility })
              }
              disabled={!editable}
              className="mb-4 w-full rounded border px-2 py-1"
            >
              {VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              {editing && editable && (
                <button
                  type="button"
                  className="rounded bg-red-600 px-3 py-1 text-white"
                  onClick={() => remove(editing)}
                >
                  Delete
                </button>
              )}
              {editable && (
                <button
                  type="button"
                  className="rounded bg-orange-500 px-3 py-1 text-white"
                  onClick={save}
                >
                  Save
                </button>
              )}
              {!editable && selfId && (
                <button
                  type="button"
                  className="rounded bg-orange-500 px-3 py-1 text-white"
                  onClick={async () => {
                    const fd = new FormData();
                    Object.entries(form).forEach(([k, v]) =>
                      fd.append(k, v as any),
                    );
                    await createMine(fd);
                    alert('Copied');
                  }}
                >
                  Copy to my ingredients
                </button>
              )}
              <button
                type="button"
                className="rounded border px-3 py-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
