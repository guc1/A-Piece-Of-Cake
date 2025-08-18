import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'crypto';
import type { Session } from 'next-auth';

export interface NewUser {
  email: string;
  password: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  accountVisibility?: 'open' | 'closed' | 'private';
  name?: string;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(':');
  const derived = scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  return timingSafeEqual(derived, keyBuf);
}

export async function createUser(input: NewUser) {
  const passwordHash = hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      handle: input.handle,
      displayName: input.displayName ?? input.name,
      avatarUrl: input.avatarUrl,
      accountVisibility: input.accountVisibility ?? 'open',
      name: input.name,
      passwordHash,
      viewId: randomUUID(),
    })
    .returning();
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
}

export async function getUserByHandle(handle: string) {
  const [user] = await db.select().from(users).where(eq(users.handle, handle));
  return user ?? null;
}

export async function getUserByViewId(viewId: string) {
  const [user] = await db.select().from(users).where(eq(users.viewId, viewId));
  return user ?? null;
}

export async function ensureUser(session: Session | null) {
  const email = session?.user?.email;
  if (!email) throw new Error('Please sign in.');

  let user = await getUserByEmail(email);
  if (user) {
    if (!user.viewId) {
      const [updated] = await db
        .update(users)
        .set({ viewId: randomUUID() })
        .where(eq(users.id, user.id))
        .returning();
      user = updated;
    }
    return user;
  }

  let baseHandle = email.split('@')[0];
  let handle = baseHandle;
  let suffix = 1;
  while (await getUserByHandle(handle)) {
    handle = `${baseHandle}${suffix++}`;
  }

  const password = randomBytes(16).toString('hex');
  user = await createUser({
    email,
    password,
    handle,
    displayName: session?.user?.name ?? undefined,
  });
  return user;
}
