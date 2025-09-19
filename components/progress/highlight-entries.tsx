import Link from 'next/link';

export interface HighlightListEntry {
  id: number;
  title: string;
  snippet: string;
  color: string;
  createdAt: string;
  linkHref: string;
  subtitle?: string;
}

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function HighlightEntriesList({
  entries,
  emptyMessage,
}: {
  entries: HighlightListEntry[];
  emptyMessage: string;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-600">{emptyMessage}</p>;
  }
  return (
    <ul className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{entry.title}</p>
              {entry.subtitle && (
                <p className="text-sm text-zinc-500">{entry.subtitle}</p>
              )}
            </div>
            <span className="text-sm text-zinc-500">
              {formatDateTime(entry.createdAt)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span
              className="rounded px-2 py-1 text-sm font-medium"
              style={{
                backgroundColor: entry.color,
                color: '#111827',
              }}
            >
              {entry.snippet}
            </span>
          </div>
          <Link
            href={entry.linkHref}
            className="mt-3 inline-block text-sm text-orange-600 hover:underline"
          >
            View in context
          </Link>
        </li>
      ))}
    </ul>
  );
}
