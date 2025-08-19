'use client';

import { useEffect, useState } from 'react';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
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

interface UserInfo {
  name: string;
  icons: string[];
}

const OTHER_USERS: {
  friends: UserInfo[];
  following: UserInfo[];
  others: UserInfo[];
} = {
  friends: [
    { name: 'Alice', icons: ['😀', '😎'] },
    { name: 'Aaron', icons: ['🥳'] },
  ],
  following: [{ name: 'Bob', icons: ['🐱', '🐶'] }],
  others: [{ name: 'Charlie', icons: ['🚀', '🍰'] }],
};

export default function IconPicker({
  value,
  onChange,
  editable = true,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'mine' | 'preset' | 'people'>('mine');
  const [myIcons, setMyIcons] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [viewUser, setViewUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('my-icons');
    if (stored) {
      try {
        setMyIcons(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, []);

  function saveMyIcons(icons: string[]) {
    setMyIcons(icons);
    if (typeof window !== 'undefined') {
      localStorage.setItem('my-icons', JSON.stringify(icons));
    }
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

  if (!editable) {
    return (
      <div className="flex items-center gap-2">
        {resolveSrc(value) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveSrc(value)} alt="icon" className="h-6 w-6" />
        ) : (
          <span>{value}</span>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-1 rounded border px-2 py-1 text-sm"
        onClick={() => {
          if (open) {
            setViewUser(null);
            setSearch('');
          }
          setOpen(!open);
        }}
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
          <div className="max-h-[80vh] w-[90vw] max-w-[700px] overflow-y-auto rounded bg-white p-4">
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
                onClick={() => setTab('people')}
                className={tab === 'people' ? 'font-bold' : ''}
              >
                Other People Icons
              </button>
            </div>
            {tab === 'mine' && (
              <div>
                <input type="file" accept="image/*" onChange={handleUpload} />
                <div className="mt-2 grid grid-cols-8 gap-2 md:grid-cols-10">
                  {myIcons.map((ic) => (
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
                        {resolveSrc(ic) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveSrc(ic)}
                            alt="icon"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{ic}</span>
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
                  ))}
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
              <div className="text-sm">
                {viewUser ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setViewUser(null)}
                      className="mb-2 text-blue-600 underline"
                    >
                      Back
                    </button>
                    <div className="grid grid-cols-8 gap-2 md:grid-cols-10">
                      {viewUser.icons.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => {
                            if (!myIcons.includes(ic)) {
                              saveMyIcons([...myIcons, ic]);
                            }
                            onChange(ic);
                            setViewUser(null);
                            setOpen(false);
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded border"
                          data-testid="icon-option"
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Search users"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="mb-2 w-full rounded border p-1"
                    />
                    {(['friends', 'following', 'others'] as const).map(
                      (section) => {
                        const users = OTHER_USERS[section].filter((u) =>
                          u.name.toLowerCase().includes(search.toLowerCase()),
                        );
                        if (users.length === 0) return null;
                        return (
                          <div key={section} className="mb-2">
                            <div className="font-medium capitalize">
                              {section === 'others' ? 'Other' : section}
                            </div>
                            <div className="mt-1 grid grid-cols-2 gap-2 md:grid-cols-3">
                              {users.map((u) => (
                                <button
                                  key={u.name}
                                  type="button"
                                  onClick={() => setViewUser(u)}
                                  className="flex items-center gap-2 rounded border p-2 text-left"
                                >
                                  <span className="flex-1 truncate">
                                    {u.name}
                                  </span>
                                  <span>{u.icons[0]}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      },
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
