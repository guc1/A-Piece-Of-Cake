import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/users';

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }
  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
  }
  const user = await createUser({ email, password, name });
  return NextResponse.json({ id: user.id }, { status: 201 });
}
