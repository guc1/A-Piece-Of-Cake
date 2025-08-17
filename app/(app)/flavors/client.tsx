'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Flavor {
  id: number;
  userId: string;
  slug: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  importance: number;
  targetMix: number;
  visibility: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

const ICONS: Record<string, string> = {
  star: '⭐',
  heart: '❤️',
  smile: '😊',
  target: '🎯',
};

function sortFlavors(list: Flavor[]) {
  return [...list].sort(
    (a, b) =>
      b.importance - a.importance ||
      a.orderIndex - b.orderIndex ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export default function FlavorsClient({
  initialFlavors,
  userId,
}: {
  initialFlavors: Flavor[];
  userId: string;
}) {
  const [flavors, setFlavors] = useState<Flavor[]>(sortFlavors(initialFlavors));
  const [editing, setEditing] = useState<Flavor | null>(null);
  const [form, setForm] = useState<any>({});
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (editing) {
      setForm(editing);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [editing]);

  function openNew() {
    setEditing({
      id: 0,
      userId,
      slug: '',
      name: '',
      description: '',
      color: '#000000',
      icon: 'star',
      importance: 50,
      targetMix: 50,
      visibility: 'public',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f: any) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      color: form.color,
      icon: form.icon,
      importance: Number(form.importance),
      targetMix: Number(form.targetMix),
      visibility: form.visibility,
    };
    const method = editing && editing.id ? 'PATCH' : 'POST';
    const url = editing && editing.id ? `/api/flavors/${editing.id}` : '/api/flavors';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data: Flavor = await res.json();
      setFlavors((prev) =>
        sortFlavors(
          prev.filter((f) => f.id !== data.id).concat(data)
        )
      );
      setEditing(null);
    }
  }

  async function handleDelete(flavor: Flavor) {
    if (!confirm(`Delete '${flavor.name}'? This can't be undone.`)) return;
    await fetch(`/api/flavors/${flavor.id}`, { method: 'DELETE' });
    setFlavors((prev) => prev.filter((f) => f.id !== flavor.id));
  }

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Flavors</h1>
      <button className="mb-4 border px-2 py-1" onClick={openNew}>
        + Flavor
      </button>
      <ul className="space-y-4">
        {flavors.map((flavor) => (
          <li
            key={flavor.id}
            id={`f7avourrow${flavor.id}-${userId}`}
            className="flex items-center gap-4 p-2 hover:bg-gray-100 focus-within:ring-2"
            tabIndex={0}
            role="button"
            onClick={() => setEditing(flavor)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(flavor);
              if (e.key === 'Delete') handleDelete(flavor);
            }}
          >
            <div
              id={`f7avourava${flavor.id}-${userId}`}
              aria-label={`${flavor.name} flavor, importance ${flavor.importance}, target ${flavor.targetMix} percent, ${flavor.visibility}`}
              title={`Importance: ${flavor.importance} • Target: ${flavor.targetMix}%`}
              style={
                {
                  '--importance': flavor.importance,
                  '--diam': `clamp(44px, calc(28px + 0.8px * var(--importance)), 120px)`,
                  backgroundColor: flavor.color,
                  width: 'var(--diam)',
                  height: 'var(--diam)',
                } as React.CSSProperties
              }
              className="flex items-center justify-center rounded-full shadow-inner text-white flex-shrink-0"
            >
              <span style={{ fontSize: 'min(48%, 44px)' }}>{ICONS[flavor.icon] || '⭐'}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div
                id={`f7avourn4me${flavor.id}-${userId}`}
                className="font-semibold truncate"
              >
                {flavor.name}
              </div>
              <div
                id={`f7avourde5cr${flavor.id}-${userId}`}
                className="text-sm text-gray-600 truncate"
              >
                {flavor.description}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target {flavor.targetMix}% • {flavor.visibility}
              </div>
            </div>
            <div className="flex gap-2 ml-2">
              <button
                id={`f7avoured1t${flavor.id}-${userId}`}
                className="underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(flavor);
                }}
              >
                Edit ▸
              </button>
              <button
                id={`f7avourd3l${flavor.id}-${userId}`}
                className="underline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(flavor);
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <dialog ref={dialogRef} onClose={() => setEditing(null)} className="p-4 rounded">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" method="dialog">
          <div className="self-center">
            <div
              style={
                {
                  '--importance': form.importance || 0,
                  '--diam': `clamp(44px, calc(28px + 0.8px * var(--importance)), 120px)`,
                  backgroundColor: form.color,
                  width: 'var(--diam)',
                  height: 'var(--diam)',
                } as React.CSSProperties
              }
              className="flex items-center justify-center rounded-full shadow-inner text-white"
            >
              <span style={{ fontSize: 'min(48%, 44px)' }}>{ICONS[form.icon] || '⭐'}</span>
            </div>
          </div>
          <label className="flex flex-col">
            <span>Name</span>
            <input
              name="name"
              value={form.name || ''}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={40}
            />
          </label>
          <label className="flex flex-col">
            <span>Description</span>
            <textarea
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              maxLength={280}
            />
          </label>
          <label className="flex flex-col">
            <span>Color</span>
            <input type="color" name="color" value={form.color || '#000000'} onChange={handleChange} />
          </label>
          <label className="flex flex-col">
            <span>Icon</span>
            <select name="icon" value={form.icon || 'star'} onChange={handleChange}>
              {Object.keys(ICONS).map((k) => (
                <option key={k} value={k}>
                  {ICONS[k]} {k}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span>Importance</span>
            <input
              type="range"
              min={0}
              max={100}
              name="importance"
              id={`f7avour1mp${editing?.id}-${userId}`}
              value={form.importance || 0}
              onChange={handleChange}
            />
          </label>
          <label className="flex flex-col">
            <span>Target %</span>
            <input
              type="number"
              min={0}
              max={100}
              name="targetMix"
              id={`f7avourt4rg${editing?.id}-${userId}`}
              value={form.targetMix || 0}
              onChange={handleChange}
            />
          </label>
          <label className="flex flex-col">
            <span>Visibility</span>
            <select name="visibility" value={form.visibility || 'public'} onChange={handleChange}>
              <option value="private">private</option>
              <option value="friends">friends</option>
              <option value="followers">followers</option>
              <option value="public">public</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
