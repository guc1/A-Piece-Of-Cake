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

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: { uid?: string };
}) {
  const session = await auth();
  if (!session) redirect('/');
  const me = await ensureUser(session);
  if (!searchParams.uid || Number(searchParams.uid) !== me.id) {
    redirect(`/ingredients?uid=${me.id}`);
  }
  return <IngredientsHome />;
}
