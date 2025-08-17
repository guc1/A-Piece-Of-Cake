import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export interface NewUser {
  email: string;
  password: string;
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
    .values({ email: input.email, name: input.name, passwordHash })
    .returning();
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
}
