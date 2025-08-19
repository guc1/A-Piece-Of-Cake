export default function TimeOverrideBadge({ label }: { label: string }) {
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <div className="fixed top-2 right-2 z-50 rounded bg-yellow-200 px-2 py-1 text-xs shadow">
      Time override: {label}
    </div>
  );
}
