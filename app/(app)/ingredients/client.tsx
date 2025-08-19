'use client';

import { useState, useMemo, useRef } from 'react';
import type { Ingredient, Visibility } from '@/types/ingredient';
import { useViewContext } from '@/lib/view-context';
import {
  createIngredient as createAction,
  updateIngredient as updateAction,
  deleteIngredient as deleteAction,
} from './actions';

const VISIBILITIES: Visibility[] = ['private', 'followers', 'friends', 'public'];

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
}: {
  userId: string; // owner id
  selfId?: string; // current viewer id for copy
  initialIngredients: Ingredient[];
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
  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    usefulness: 50,
    description: '',
    whyUsed: '',
    whenUsed: '',
    tips: '',
    imageUrl: '',
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
      imageUrl: '',
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
      imageUrl: i.imageUrl || '',
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

  return (
    <section>
      <div className="mb-4 flex items-center gap-4">
        <button
          id={`1ngred-add-${userId}`}
          onClick={openNew}
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
            {i.imageUrl ? (
              <img
                id={`1ngred-card-img-${i.id}-${userId}`}
                src={i.imageUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div
                id={`1ngred-card-img-${i.id}-${userId}`}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-300 text-xl font-bold"
              >
                {i.title
                  .split(' ')
                  .map((s) => s[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            )}
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
            <div className="mb-4 flex flex-col items-center gap-2">
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt=""
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200" />
              )}
              <input
                id={`1ngred-imgup-${editing ? editing.id : 'new'}-${userId}`}
                type="text"
                placeholder="Image URL"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                disabled={!editable}
                className="w-full rounded border px-2 py-1"
              />
            </div>
            <label className="block text-sm font-medium" htmlFor={`1ngred-t1tle-${editing ? editing.id : 'new'}-${userId}`}>
              Title
            </label>
            <input
              id={`1ngred-t1tle-${editing ? editing.id : 'new'}-${userId}`}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label className="block text-sm font-medium" htmlFor={`1ngred-sh0rt-${editing ? editing.id : 'new'}-${userId}`}>
              Short description
            </label>
            <input
              id={`1ngred-sh0rt-${editing ? editing.id : 'new'}-${userId}`}
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label className="block text-sm font-medium" htmlFor={`1ngred-u53-${editing ? editing.id : 'new'}-${userId}`}>
              Usefulness ({form.usefulness})
            </label>
            <input
              id={`1ngred-u53-${editing ? editing.id : 'new'}-${userId}`}
              type="range"
              min={0}
              max={100}
              value={form.usefulness}
              onChange={(e) => setForm({ ...form, usefulness: Number(e.target.value) })}
              disabled={!editable}
              className="mb-2 w-full"
            />
            <label className="block text-sm font-medium" htmlFor={`1ngred-de5c-${editing ? editing.id : 'new'}-${userId}`}>
              What it is
            </label>
            <textarea
              id={`1ngred-de5c-${editing ? editing.id : 'new'}-${userId}`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label className="block text-sm font-medium" htmlFor={`1ngred-why-${editing ? editing.id : 'new'}-${userId}`}>
              Why used
            </label>
            <textarea
              id={`1ngred-why-${editing ? editing.id : 'new'}-${userId}`}
              value={form.whyUsed}
              onChange={(e) => setForm({ ...form, whyUsed: e.target.value })}
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label className="block text-sm font-medium" htmlFor={`1ngred-when-${editing ? editing.id : 'new'}-${userId}`}>
              When used / situations
            </label>
            <textarea
              id={`1ngred-when-${editing ? editing.id : 'new'}-${userId}`}
              value={form.whenUsed}
              onChange={(e) => setForm({ ...form, whenUsed: e.target.value })}
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label className="block text-sm font-medium" htmlFor={`1ngred-tips-${editing ? editing.id : 'new'}-${userId}`}>
              Tips
            </label>
            <textarea
              id={`1ngred-tips-${editing ? editing.id : 'new'}-${userId}`}
              value={form.tips}
              onChange={(e) => setForm({ ...form, tips: e.target.value })}
              disabled={!editable}
              className="mb-2 w-full rounded border px-2 py-1"
            />
            <label className="block text-sm font-medium" htmlFor={`1ngred-vis-${editing ? editing.id : 'new'}-${userId}`}>
              Visibility
            </label>
            <select
              id={`1ngred-vis-${editing ? editing.id : 'new'}-${userId}`}
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value as Visibility })}
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
                    Object.entries(form).forEach(([k, v]) => fd.append(k, v as any));
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
