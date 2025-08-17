import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import FlavorsClient from './client';

export default async function FlavorsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id || '';
  const flavors = userId ? await listFlavors(userId) : [];
  return <FlavorsClient userId={userId} initialFlavors={flavors} />;
}
