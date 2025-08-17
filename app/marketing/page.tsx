import Link from 'next/link';

export default function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">A Piece of Cake</h1>
      <div className="flex gap-4">
        <Link
          href="/signin"
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
