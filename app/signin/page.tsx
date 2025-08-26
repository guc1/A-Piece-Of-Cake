'use client';

import { signIn } from 'next-auth/react';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLogs } from '@/components/dev/logs-provider';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { unlock } = useLogs();
  const clicks = useRef(0);

  const handleSecretClick = () => {
    clicks.current += 1;
    if (clicks.current >= 5) {
      const code = window.prompt('Enter code');
      if (code === '123Yergush123') {
        unlock();
      }
      clicks.current = 0;
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">
          A Piece{' '}
          <span
            onClick={handleSecretClick}
            className="cursor-pointer text-orange-500 select-none"
          >
            O
          </span>
          f Cake
        </h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await signIn('credentials', {
              email,
              password,
              redirect: true,
              callbackUrl: '/flavors',
            });
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
