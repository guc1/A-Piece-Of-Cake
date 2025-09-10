'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">A Piece Of Cake</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
                callbackUrl: '/flavors',
              });
              if (!res || res.error) {
                setError('Invalid email or password');
                return;
              }
              if (res.url) router.push(res.url);
            } catch {
              setError('Invalid email or password');
            }
          }}
          className="flex flex-col gap-4"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border p-2"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="border p-2"
          />
          <Button type="submit">Enter</Button>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </form>
        <p className="mt-4 text-center">
          <Link href="/signup" className="text-blue-600">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
