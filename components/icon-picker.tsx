'use client';

import { useState, useEffect } from 'react';

const PRESET_ICONS = [
  '⭐',
  '❤️',
  '🌞',
  '🌙',
  '📚',
  '🔥',
  '⚡',
  '🍀',
  '🎵',
  '😊',
];

export default function IconPicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (icon: string) => void;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'own' | 'preset' | 'other'>('preset');
  const [ownIcons, setOwnIcons] = useState<string[]>([]);
  const [newIcon, setNewIcon] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('user-icons');
      if (stored) setOwnIcons(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const saveOwnIcons = (icons: string[]) => {
    setOwnIcons(icons);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('user-icons', JSON.stringify(icons));
      } catch {
        // ignore
      }
    }
  };

  const handleAdd = () => {
    if (!newIcon) return;
    if (!ownIcons.includes(newIcon)) {
      const updated = [...ownIcons, newIcon];
      saveOwnIcons(updated);
    }
    setNewIcon('');
  };

  const handleUse = (icon: string) => {
    onChange(icon);
    setOpen(false);
  };

  const handleDelete = (icon: string) => {
    const updated = ownIcons.filter((ic) => ic !== icon);
    saveOwnIcons(updated);
  };

  return (
    <div className="space-y-2">
      <button
        id={id}
        type="button"
        className="rounded border px-2 py-1"
        onClick={() => setOpen(true)}
      >
        {value ? `Icon: ${value}` : 'Choose icon'}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[80vh] w-80 overflow-auto rounded bg-white p-4 shadow">
            <div className="mb-2 flex gap-2 text-sm">
              <button
                type="button"
                className={tab === 'own' ? 'font-bold' : ''}
                onClick={() => setTab('own')}
              >
                Your icons
              </button>
              <button
                type="button"
                className={tab === 'preset' ? 'font-bold' : ''}
                onClick={() => setTab('preset')}
              >
                Preset icons
              </button>
              <button
                type="button"
                className={tab === 'other' ? 'font-bold' : ''}
                onClick={() => setTab('other')}
              >
                Other icons
              </button>
            </div>
            {tab === 'own' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    placeholder="Emoji"
                    className="w-full rounded border px-2 py-1"
                  />
                  <button
                    type="button"
                    className="rounded border px-2"
                    onClick={handleAdd}
                  >
                    Add
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {ownIcons.map((ic) => (
                    <div key={ic} className="flex flex-col items-center">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded border"
                        onClick={() => handleUse(ic)}
                      >
                        {ic}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-500"
                        onClick={() => handleDelete(ic)}
                      >
                        delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'preset' && (
              <div className="grid grid-cols-5 gap-2">
                {PRESET_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded border"
                    onClick={() => handleUse(ic)}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            )}
            {tab === 'other' && (
              <p className="text-sm text-gray-500">
                Search other users coming soon.
              </p>
            )}
            <div className="mt-4 text-right">
              <button
                type="button"
                className="rounded border px-2 py-1"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
