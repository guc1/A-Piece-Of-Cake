import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';

export function IngredientsHome() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Ingredients</h1>
    </section>
  );
}

export default async function IngredientsPage() {
  const session = await auth();
  if (!session) redirect('/');
  await ensureUser(session);
  return <IngredientsHome />;
}
