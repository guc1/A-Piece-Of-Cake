'use client';

import type { Flavor } from '@/types/flavor';
import type { Subflavor } from '@/types/subflavor';
import { copySubflavor } from '@/app/(app)/flavors/[flavorId]/subflavors/actions';
import { useViewContext } from '@/lib/view-context';

export default function AllSubflavorsClient({
  userId,
  selfId,
  groups,
  targetFlavorId,
}: {
  userId: string;
  selfId?: string;
  groups: { flavor: Flavor; subflavors: Subflavor[] }[];
  targetFlavorId?: string;
}) {
  const { editable } = useViewContext();
  async function handleCopy(sub: Subflavor) {
    if (!targetFlavorId) return;
    await copySubflavor(userId, sub.id, targetFlavorId);
    alert('Copied');
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
                    <span
                      aria-label={s.name}
                      className="text-2xl"
                      style={{ color: s.color }}
                    >
                      {s.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold">{s.name}</div>
                      <div className="truncate text-sm text-gray-600">
                        {s.description}
                      </div>
                    </div>
                  </div>
                  {selfId && targetFlavorId && !editable && (
                    <button
                      id={`s7ubflavcopy${s.id}-${userId}`}
                      className="rounded bg-orange-500 px-2 py-1 text-white"
                      onClick={() => handleCopy(s)}
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
    </div>
  );
}
