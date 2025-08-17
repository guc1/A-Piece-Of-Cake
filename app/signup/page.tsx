'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
          });
          if (res.ok) {
            await signIn('credentials', {
              email,
              password,
              redirect: true,
              callbackUrl: '/flavors',
            });
          } else {
            const data = await res.json();
            setError(data.error || 'Sign up failed');
          }
        }}
        className="flex flex-col gap-4"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="border p-2"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2"
          required
        />
        {error && <p className="text-red-600">{error}</p>}
        <Button type="submit">Create account</Button>
        <p className="text-sm">
          Already have an account? <Link className="underline" href="/signin">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
