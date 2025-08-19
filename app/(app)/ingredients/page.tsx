import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { listIngredients } from '@/lib/ingredients-store';
import IngredientsClient from './client';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { listPeople } from '@/lib/people-store';

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams?: Promise<{ at?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const at = params?.at ? new Date(params.at) : undefined;
  const ingredients = await listIngredients(String(me.id), me.id, at);
  const people = await listPeople(me.id);
  const ctx = buildViewContext({
    ownerId: me.id,
    viewerId: me.id,
    mode: at ? 'historical' : 'owner',
    viewId: me.viewId,
    snapshotDate: params?.at,
  });
  return (
    <ViewContextProvider value={ctx}>
      <IngredientsClient
        userId={String(me.id)}
        selfId={String(me.id)}
        initialIngredients={ingredients}
        people={people}
      />
    </ViewContextProvider>
  );
}

export function IngredientsHome({
  userId,
  selfId,
  initialIngredients,
  people,
}: {
  userId: string;
  selfId?: string;
  initialIngredients: any[];
  people?: any;
}) {
  return (
    <IngredientsClient
      userId={userId}
      selfId={selfId}
      initialIngredients={initialIngredients as any}
      people={people as any}
    />
  );
}
