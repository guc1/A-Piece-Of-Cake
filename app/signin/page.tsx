'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const [password, setPassword] = useState('');

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await signIn('credentials', { password, redirect: true, callbackUrl: '/' });
        }}
        className="flex flex-col gap-4"
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Guest password"
          className="border p-2"
        />
        <Button type="submit">Enter</Button>
      </form>
    </main>
  );
}
