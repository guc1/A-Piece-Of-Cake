import Link from 'next/link';

export default function ProgressPage() {
  return (
    <main className="p-6">
      <Link
        href="/progress/testchat"
        className="bg-orange-500 text-white px-4 py-2 rounded"
      >
        Chat with LLM
      </Link>
    </main>
  );
}
