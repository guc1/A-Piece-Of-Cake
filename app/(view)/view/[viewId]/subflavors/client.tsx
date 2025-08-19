'use client';

import { useTransition } from 'react';
import type { Flavor } from '@/types/flavor';
import type { Subflavor } from '@/types/subflavor';
import { copySubflavor } from '@/app/(app)/flavors/[flavorId]/subflavors/actions';

type Group = {
  flavor: Flavor;
  subflavors: Subflavor[];
};

export default function SubflavorsAllClient({
  fromUserId,
  groups,
  targetFlavorId,
}: {
  fromUserId: string;
  groups: Group[];
  targetFlavorId?: string;
}) {
  const [pending, startTransition] = useTransition();

  async function handleCopy(id: string) {
    if (!targetFlavorId) return;
    await copySubflavor(fromUserId, id, targetFlavorId);
    alert('Copied');
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.flavor.id}>
          <h2 className="text-lg font-semibold">{g.flavor.name}</h2>
          <ul className="mt-2 space-y-2">
            {g.subflavors.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded border p-2"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  {s.description && (
                    <div className="text-sm text-gray-600">{s.description}</div>
                  )}
                </div>
                {targetFlavorId && (
                  <button
                    id={`cpysubflav-${s.id}`}
                    className="rounded bg-orange-500 px-3 py-1 text-white disabled:opacity-50"
                    disabled={pending}
                    onClick={() => startTransition(() => handleCopy(s.id))}
                  >
                    Copy
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
