import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { listIngredients } from '@/lib/ingredients-store';
import IngredientsForPlanningClient from './client';
import { notFound } from 'next/navigation';

export default async function IngredientsForPlanningPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; block?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const ingredients = await listIngredients(String(me.id), me.id);
  const date = params?.date || '';
  const blockId = params?.block || '';
  const mode = params?.mode === 'live' ? 'live' : 'next';
  return (
    <IngredientsForPlanningClient
      userId={String(me.id)}
      date={date}
      blockId={blockId}
      ingredients={ingredients}
      mode={mode}
    />
  );
}

