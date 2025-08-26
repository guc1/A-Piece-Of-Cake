'use client';

import { useState } from 'react';
import { useLogs } from './logs-provider';

export function LogsButton() {
  const { logs, unlocked } = useLogs();
  const [open, setOpen] = useState(false);

  if (!unlocked) return null;

  return (
    <>
      <button
        className="fixed top-4 right-4 bg-orange-500 text-white px-3 py-2 rounded"
        onClick={() => setOpen(true)}
      >
        Logs
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded max-h-[80vh] w-[90vw] max-w-lg overflow-auto">
            <button
              className="mb-2 text-sm text-gray-500"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            <ul className="space-y-2">
              {logs.map((l, i) => (
                <li key={i} className="border p-2 rounded">
                  <div>
                    <strong>Request:</strong> {l.request}
                  </div>
                  <div>
                    <strong>Response:</strong> {l.response}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
