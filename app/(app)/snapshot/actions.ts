'use server';

import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { createProfileSnapshot } from '@/lib/profile-snapshots';

export async function snapshotProfileAction(date: string) {
  const session = await auth();
  const me = await ensureUser(session);
  const d = new Date(date);
  await createProfileSnapshot(me.id, d);
}
