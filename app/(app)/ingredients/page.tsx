import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { listIngredients } from '@/lib/ingredients-store';
import IngredientsClient from './client';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams?: { at?: string };
}) {
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const at = searchParams?.at ? new Date(searchParams.at) : undefined;
  const ingredients = await listIngredients(String(me.id), me.id, at);
  const ctx = buildViewContext({
    ownerId: me.id,
    viewerId: me.id,
    mode: at ? 'historical' : 'owner',
    viewId: me.viewId,
    snapshotDate: searchParams?.at,
  });
  return (
    <ViewContextProvider value={ctx}>
      <IngredientsClient
        userId={String(me.id)}
        selfId={String(me.id)}
        initialIngredients={ingredients}
      />
    </ViewContextProvider>
  );
}

export function IngredientsHome({
  userId,
  selfId,
  initialIngredients,
}: {
  userId: string;
  selfId?: string;
  initialIngredients: any[];
}) {
  return (
    <IngredientsClient
      userId={userId}
      selfId={selfId}
      initialIngredients={initialIngredients as any}
    />
  );
}
