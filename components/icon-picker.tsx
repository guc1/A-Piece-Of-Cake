'use client';

import { useEffect, useState } from 'react';
import type { PeopleLists, Person } from '@/lib/people-store';
import { useViewContext } from '@/lib/view-context';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  people?: PeopleLists;
}

const PRESET_ICONS = [
  '⭐',
  '❤️',
  '🌞',
  '🌙',
  '📚',
  '🔥',
  '🎯',
  '🏃',
  '💼',
  '🎵',
];

export default function IconPicker({
  value,
  onChange,
  editable = true,
  people,
}: IconPickerProps) {
  const ctx = useViewContext();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'mine' | 'preset' | 'people'>('mine');
  const [myIcons, setMyIcons] = useState<string[]>([]);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Person | null>(null);
  const [userIcons, setUserIcons] = useState<string[] | null>(null);

  // Load the user's saved icons. We first attempt to fetch from the
  // server so icons are shared across devices, falling back to any
  // locally cached value in case the request fails (offline, etc.).
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/my-icons');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.icons)) {
            const iconsArr = data.icons.map((i: unknown) => String(i));
            const unique = Array.from(new Set<string>(iconsArr));
            setMyIcons(unique);
            if (typeof window !== 'undefined') {
              localStorage.setItem('my-icons', JSON.stringify(unique));
            }
            return;
          }
        }
      } catch {
        /* ignore network errors */
      }
      if (typeof window === 'undefined') return;
      const stored = localStorage.getItem('my-icons');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setMyIcons(Array.from(new Set(parsed.map(String))));
          }
        } catch {
          /* ignore */
        }
      }
    }
    load();
  }, []);

  // Persist the user's icon library locally and to the server so others
  // can browse it. Errors from the network request are ignored; the
  // local copy still updates.
  function saveMyIcons(icons: string[]) {
    const unique = Array.from(new Set(icons));
    setMyIcons(unique);
    if (typeof window !== 'undefined') {
      localStorage.setItem('my-icons', JSON.stringify(unique));
    }
    fetch('/api/my-icons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icons: unique }),
    }).catch(() => {
      /* ignore network errors */
    });
  }

  function resolveSrc(ic: string) {
    if (ic.startsWith('data:')) return ic;
    if (/^[A-Za-z0-9+/=]+$/.test(ic)) {
      return `data:image/png;base64,${ic}`;
    }
    return '';
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, size, size);
          const data = canvas.toDataURL('image/png');
          saveMyIcons([...myIcons, data]);
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function deleteIcon(ic: string) {
    saveMyIcons(myIcons.filter((i) => i !== ic));
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

  async function openUser(u: Person) {
    setSelectedUser(u);
    setUserIcons(null);
    try {
      const query = ctx.snapshotDate ? `?snapshot=${ctx.snapshotDate}` : '';
      const res = await fetch(`/api/users/${u.id}/icons${query}`);
      if (res.ok) {
        const data = await res.json();
        setUserIcons(Array.isArray(data.icons) ? data.icons : []);
      } else {
        setUserIcons([]);
      }
    } catch {
      setUserIcons([]);
    }
  }

  const categories = [
    { label: 'Friends', list: filterPeople(people?.friends) },
    { label: 'Following', list: filterPeople(people?.following) },
    { label: 'Others', list: filterPeople(people?.others) },
  ];

  if (!editable) {
    const content = resolveSrc(value) ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={resolveSrc(value)} alt="icon" className="h-6 w-6" />
    ) : (
      <span>{value}</span>
    );
    if (ctx.snapshotDate) {
      return (
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Add to your My Icons?')) {
              if (!myIcons.includes(value)) {
                saveMyIcons([...myIcons, value]);
              }
            }
          }}
          className="flex items-center gap-2"
        >
          {content}
        </button>
      );
    }
    return <div className="flex items-center gap-2">{content}</div>;
  }

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-1 rounded border px-2 py-1 text-sm"
        onClick={() => setOpen(!open)}
      >
        {value && (
          <span>
            {resolveSrc(value) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveSrc(value)}
                alt="icon"
                className="inline h-4 w-4"
              />
            ) : (
              value
            )}
          </span>
        )}
        Choose Icon
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex h-[90vh] w-[90vw] max-w-3xl flex-col overflow-hidden rounded bg-white p-4">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mb-2 flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => setTab('mine')}
                className={tab === 'mine' ? 'font-bold' : ''}
              >
                My Icons
              </button>
              <button
                type="button"
                onClick={() => setTab('preset')}
                className={tab === 'preset' ? 'font-bold' : ''}
              >
                Preset Icons
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('people');
                  setSelectedUser(null);
                }}
                className={tab === 'people' ? 'font-bold' : ''}
              >
                Other People Icons
              </button>
            </div>
            {tab === 'mine' && (
              <div className="flex h-full flex-col overflow-hidden">
                <input type="file" accept="image/*" onChange={handleUpload} />
                <div className="mt-2 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-2 md:grid-cols-10">
                    {myIcons.map((ic) => {
                      const src = resolveSrc(ic);
                      return (
                        <div key={ic} className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              onChange(ic);
                              setOpen(false);
                            }}
                            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border"
                            data-testid="icon-option"
                          >
                            {src ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={src}
                                alt="icon"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-lg">{ic}</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteIcon(ic)}
                            className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white text-xs"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {tab === 'preset' && (
              <div className="grid grid-cols-8 gap-2 md:grid-cols-10">
                {PRESET_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => {
                      if (!myIcons.includes(ic)) {
                        saveMyIcons([...myIcons, ic]);
                      }
                      onChange(ic);
                      setOpen(false);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded border"
                    data-testid="icon-option"
                  >
                    {ic}
                  </button>
                ))}
              </div>
            )}
            {tab === 'people' && (
              <div className="flex h-full flex-col text-sm">
                {!selectedUser ? (
                  <>
                    <input
                      type="text"
                      placeholder="Search users"
                      value={peopleSearch}
                      onChange={(e) => setPeopleSearch(e.target.value)}
                      className="mb-2 w-full rounded border p-1"
                    />
                    <div className="flex-1 overflow-y-auto pr-1">
                      {categories.map((c) => (
                        <div key={c.label} className="mb-4">
                          {c.list.length > 0 && (
                            <>
                              <div className="font-medium">{c.label}</div>
                              <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                {c.list.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => openUser(p)}
                                    className="truncate rounded border px-2 py-1 text-left"
                                  >
                                    {p.displayName || p.handle}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="mb-2 underline"
                    >
                      Back to users
                    </button>
                    {userIcons === null && <div>Loading…</div>}
                    {userIcons !== null && (
                      <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-8 gap-2 md:grid-cols-10">
                          {userIcons.map((ic) => (
                            <button
                              key={ic}
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm('Add to your My Icons?')
                                ) {
                                  if (!myIcons.includes(ic)) {
                                    saveMyIcons([...myIcons, ic]);
                                  }
                                  onChange(ic);
                                }
                                setOpen(false);
                                setSelectedUser(null);
                              }}
                              className="flex h-10 w-10 items-center justify-center rounded border"
                              data-testid="icon-option"
                            >
                              {resolveSrc(ic) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={resolveSrc(ic)}
                                  alt="icon"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                ic
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
