import crypto from 'crypto';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
}

const users = new Map<string, StoredUser>();

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function createUser(name: string, email: string, password: string): StoredUser {
  if (users.has(email)) {
    throw new Error('Email already registered');
  }
  const id = crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const user: StoredUser = { id, name, email, passwordHash, salt };
  users.set(email, user);
  return user;
}

export function verifyUser(email: string, password: string): StoredUser | null {
  const user = users.get(email);
  if (!user) return null;
  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) return null;
  return user;
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return users.get(email);
}
