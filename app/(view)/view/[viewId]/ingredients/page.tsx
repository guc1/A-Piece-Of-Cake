import { getUserByViewId, ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { IngredientsHome } from '@/app/(app)/ingredients/page';
import { auth } from '@/lib/auth';
import { listIngredients } from '@/lib/ingredients-store';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';

export default async function ViewIngredientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ viewId: string }>;
  searchParams?: Promise<{ at?: string }>;
}) {
  const { viewId } = await params;
  const sp = await searchParams;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  const viewerId = viewer ? viewer.id : null;
  const at = sp?.at ? new Date(sp.at) : undefined;
  const ingredients = await listIngredients(String(user.id), viewerId, at);
  const ctx = buildViewContext({
    ownerId: user.id,
    viewerId: viewerId ?? null,
    mode: at ? 'historical' : 'viewer',
    viewId: user.viewId,
    snapshotDate: sp?.at,
  });
  return (
    <ViewContextProvider value={ctx}>
      <section id={`v13w-igrd-${user.id}`}>
        <IngredientsHome
          userId={String(user.id)}
          selfId={viewerId ? String(viewerId) : undefined}
          initialIngredients={ingredients}
        />
      </section>
    </ViewContextProvider>
  );
}
