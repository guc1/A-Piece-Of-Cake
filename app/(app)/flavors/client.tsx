'use client';
import { useState } from 'react';
import type { Flavor, Visibility } from '@/types/flavor';

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
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  function openCreate() {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      color: '#888888',
      icon: ICONS[0],
      importance: 50,
      targetMix: 50,
      visibility: 'private',
      orderIndex: flavors.length,
    });
    setDrawerOpen(true);
  }

  function openEdit(f: Flavor) {
    setEditing(f);
    setForm({
      name: f.name,
      description: f.description,
      color: f.color,
      icon: f.icon,
      importance: f.importance,
      targetMix: f.targetMix,
      visibility: f.visibility,
      orderIndex: f.orderIndex,
    });
    setDrawerOpen(true);
  }

  async function save() {
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/flavors/${editing.id}` : '/api/flavors';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data: Flavor = await res.json();
      if (editing) {
        setFlavors((prev) => sortFlavors(prev.map((p) => (p.id === data.id ? data : p))));
      } else {
        setFlavors((prev) => sortFlavors([...prev, data]));
      }
      setDrawerOpen(false);
    }
  }

  async function remove(f: Flavor) {
    if (!confirm(`Delete '${f.name}'? This can't be undone.`)) return;
    const res = await fetch(`/api/flavors/${f.id}`, { method: 'DELETE' });
    if (res.ok) {
      setFlavors((prev) => prev.filter((p) => p.id !== f.id));
    }
  }

  return (
    <section>
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreate}
          className="rounded bg-orange-500 px-3 py-2 text-white"
          id={`f7avoured1tnew-${userId}`}
        >
          + Flavor
        </button>
      </div>
      <ul className="flex flex-col gap-4" id={`f7avourli5t-${userId}`}>
        {flavors.map((f) => (
          <li
            key={f.id}
            id={`f7avourrow${f.id}-${userId}`}
            role="button"
            tabIndex={0}
            onClick={() => openEdit(f)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') openEdit(f);
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
                onClick={() => openEdit(f)}
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
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/20"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDrawerOpen(false);
          }}
        >
          <div className="h-full w-80 bg-white p-4 shadow-lg" role="dialog">
            <h2 className="mb-4 text-lg font-semibold">
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium" htmlFor={`name-input`}>
                  Name
                </label>
                <input
                  id={`f7avourn4me${editing ? editing.id : 'new'}-${userId}`}
                  className="w-full rounded border p-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  minLength={2}
                  maxLength={40}
                />
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor={`desc-input`}>
                  Description
                </label>
                <textarea
                  id={`f7avourde5cr${editing ? editing.id : 'new'}-${userId}`}
                  className="w-full rounded border p-1"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={280}
                />
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
                <label className="block text-sm font-medium" htmlFor={`importance`}>Importance</label>
                <input
                  id={`f7avour1mp${editing ? editing.id : 'new'}-${userId}`}
                  type="range"
                  min={0}
                  max={100}
                  value={form.importance}
                  onChange={(e) => setForm({ ...form, importance: Number(e.target.value) })}
                />
                <span className="ml-2 text-sm">{form.importance}</span>
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor={`target`}>Target %</label>
                <input
                  id={`f7avourt4rg${editing ? editing.id : 'new'}-${userId}`}
                  type="number"
                  min={0}
                  max={100}
                  value={form.targetMix}
                  onChange={(e) => setForm({ ...form, targetMix: Number(e.target.value) })}
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
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="rounded border px-3 py-1"
                  onClick={() => setDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  id={`f7avour5ave${editing ? editing.id : 'new'}-${userId}`}
                  type="submit"
                  className="rounded bg-orange-500 px-3 py-1 text-white"
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
