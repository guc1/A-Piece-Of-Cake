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

const OTHER_USERS = {
  friends: ['😀', '😎'],
  following: ['🐱', '🐶'],
  others: ['🚀', '🍰'],
};

export default function IconPicker({
  value,
  onChange,
  editable = true,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'mine' | 'preset' | 'others'>('mine');
  const [myIcons, setMyIcons] = useState<string[]>([]);

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

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx && typeof ev.target?.result === 'string') {
          img.src = ev.target.result;
          ctx.drawImage(img, 0, 0, 64, 64);
          const data = canvas.toDataURL();
          saveMyIcons([...myIcons, data]);
        }
      };
      if (typeof ev.target?.result === 'string') {
        img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);
  }

  function deleteIcon(ic: string) {
    saveMyIcons(myIcons.filter((i) => i !== ic));
  }

  if (!editable) {
    return (
      <div className="flex items-center gap-2">
        {value.startsWith('data:') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="icon" className="h-6 w-6" />
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
        onClick={() => setOpen(!open)}
      >
        {value && (
          <span>
            {value.startsWith('data:') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="icon" className="inline h-4 w-4" />
            ) : (
              value
            )}
          </span>
        )}
        Choose Icon
      </button>
      {open && (
        <div className="mt-2 rounded border p-2">
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
              onClick={() => setTab('others')}
              className={tab === 'others' ? 'font-bold' : ''}
            >
              Other Icons
            </button>
          </div>
          {tab === 'mine' && (
            <div>
              <input type="file" accept="image/*" onChange={handleUpload} />
              <div className="mt-2 grid grid-cols-5 gap-2">
                {myIcons.map((ic) => (
                  <div key={ic} className="relative">
                    <button
                      type="button"
                      onClick={() => onChange(ic)}
                      className="flex h-8 w-8 items-center justify-center overflow-hidden rounded border"
                      data-testid="icon-option"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ic}
                        alt="icon"
                        className="h-full w-full object-cover"
                      />
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
            <div className="grid grid-cols-5 gap-2">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => onChange(ic)}
                  className="flex h-8 w-8 items-center justify-center rounded border"
                  data-testid="icon-option"
                >
                  {ic}
                </button>
              ))}
            </div>
          )}
          {tab === 'others' && (
            <div className="text-sm">
              <input
                type="text"
                placeholder="Search"
                className="mb-2 w-full rounded border p-1"
              />
              <div className="mb-2">
                <div className="font-medium">Friends</div>
                <div className="mt-1 grid grid-cols-5 gap-2">
                  {OTHER_USERS.friends.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => onChange(ic)}
                      className="flex h-8 w-8 items-center justify-center rounded border"
                      data-testid="icon-option"
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-2">
                <div className="font-medium">Following</div>
                <div className="mt-1 grid grid-cols-5 gap-2">
                  {OTHER_USERS.following.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => onChange(ic)}
                      className="flex h-8 w-8 items-center justify-center rounded border"
                      data-testid="icon-option"
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium">Other</div>
                <div className="mt-1 grid grid-cols-5 gap-2">
                  {OTHER_USERS.others.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => onChange(ic)}
                      className="flex h-8 w-8 items-center justify-center rounded border"
                      data-testid="icon-option"
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
