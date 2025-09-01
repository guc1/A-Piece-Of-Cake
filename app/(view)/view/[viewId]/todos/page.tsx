import { getUserByViewId, ensureUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listTodos } from '@/lib/todos-store';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import { TodosHome } from '@/app/(app)/todos/page';

export default async function ViewTodosPage({
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
  const todos = await listTodos(String(user.id), viewerId, at);
  const ctx = buildViewContext({
    ownerId: user.id,
    viewerId: viewerId ?? null,
    mode: at ? 'historical' : 'viewer',
    viewId: user.viewId,
    snapshotDate: sp?.at,
  });
  return (
    <ViewContextProvider value={ctx}>
      <section id={`v13w-todo-${user.id}`}>
        <TodosHome userId={String(user.id)} initialTodos={todos} />
      </section>
    </ViewContextProvider>
  );
}
