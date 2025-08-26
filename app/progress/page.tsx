import Link from 'next/link';

export default function ProgressPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl mb-4">Progress</h1>
      <Link
        href="/progress/testchat"
        className="bg-orange-500 text-white px-4 py-2 rounded"
      >
        Chat with llm
      </Link>
    </main>
  );
}
