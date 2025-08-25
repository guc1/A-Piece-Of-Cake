'use client';

import type { Flavor } from '@/types/flavor';
import type { Subflavor } from '@/types/subflavor';
import {
  copySubflavor,
  copySubflavorAsFlavor,
} from '@/app/(app)/flavors/[flavorId]/subflavors/actions';
import { useViewContext } from '@/lib/view-context';
import { useState } from 'react';

function iconSrc(ic: string) {
  if (ic.startsWith('data:')) return ic;
  if (/^[A-Za-z0-9+/=]+$/.test(ic)) return `data:image/png;base64,${ic}`;
  return null;
}

export default function AllSubflavorsClient({
  userId,
  selfId,
  groups,
  targetFlavorId,
  selfFlavors,
}: {
  userId: string;
  selfId?: string;
  groups: { flavor: Flavor; subflavors: Subflavor[] }[];
  targetFlavorId?: string;
  selfFlavors: Flavor[];
}) {
  const { editable } = useViewContext();
  const [copying, setCopying] = useState<Subflavor | null>(null);
  const [dest, setDest] = useState<string>(targetFlavorId || '');

  async function handleConfirm() {
    if (!copying) return;
    if (dest === 'new') {
      await copySubflavorAsFlavor(userId, copying.id);
    } else if (dest) {
      await copySubflavor(userId, copying.id, dest);
    }
    setCopying(null);
    alert('Copied');
  }
  function startCopy(sub: Subflavor) {
    setDest(targetFlavorId || '');
    setCopying(sub);
  }
  return (
    <div className="space-y-8">
      {groups.map(({ flavor, subflavors }) => (
        <div key={flavor.id}>
          <h2 className="mb-2 text-xl font-semibold">{flavor.name}</h2>
          {subflavors.length === 0 ? (
            <p className="text-sm text-gray-500">No subflavors.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {subflavors.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div className="flex items-center gap-2">
                    {iconSrc(s.icon) ? (
                      <img
                        src={iconSrc(s.icon) as string}
                        alt=""
                        className="h-6 w-6"
                      />
                    ) : (
                      <span
                        aria-label={s.name}
                        className="text-2xl"
                        style={{ color: s.color }}
                      >
                        {s.icon}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold">{s.name}</div>
                      <div className="truncate text-sm text-gray-600">
                        {s.description}
                      </div>
                    </div>
                  </div>
                  {selfId && !editable && (
                    <button
                      id={`s7ubflavcopy${s.id}-${userId}`}
                      className="rounded bg-orange-500 px-2 py-1 text-white"
                      onClick={() => startCopy(s)}
                    >
                      Copy
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {copying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Copy {copying.name}</h2>
            <label className="mb-2 block text-sm font-medium" htmlFor="copy-dest">
              Choose destination
            </label>
            <select
              id="copy-dest"
              className="mb-4 w-full rounded border p-2"
              value={dest}
              onChange={(e) => setDest(e.target.value)}
            >
              <option value="" disabled>
                Select flavor
              </option>
              {targetFlavorId && (
                <option value={targetFlavorId}>Current flavor</option>
              )}
              {selfFlavors
                .filter((f) => f.id !== targetFlavorId)
                .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
              <option value="new">Copy as main flavor</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1"
                onClick={() => setCopying(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-orange-500 px-3 py-1 text-white"
                onClick={handleConfirm}
                disabled={!dest}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
