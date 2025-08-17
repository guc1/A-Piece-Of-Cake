import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { flavors } from '@/lib/db/schema';
import { desc, asc, eq } from 'drizzle-orm';
import FlavorsClient from './client';

export default async function FlavorsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return null;
  }
  const data = (await db
    .select()
    .from(flavors)
    .where(eq(flavors.userId, userId))
    .orderBy(desc(flavors.importance), asc(flavors.orderIndex), asc(flavors.createdAt))) as any;
  return <FlavorsClient initialFlavors={data} userId={userId} />;
}
