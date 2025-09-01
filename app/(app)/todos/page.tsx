import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { listTodos } from '@/lib/todos-store';
import TodosClient from './client';
import { buildViewContext } from '@/lib/profile';
import { ViewContextProvider } from '@/lib/view-context';
import type { Todo } from '@/types/todo';

export default async function TodosPage({
  searchParams,
}: {
  searchParams?: Promise<{ at?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const at = sp?.at ? new Date(sp.at) : undefined;
  const todos = await listTodos(String(me.id), me.id, at);
  const ctx = buildViewContext({
    ownerId: me.id,
    viewerId: me.id,
    mode: at ? 'historical' : 'owner',
    viewId: me.viewId,
    snapshotDate: sp?.at,
  });
  return (
    <ViewContextProvider value={ctx}>
      <TodosClient userId={String(me.id)} initialTodos={todos} />
    </ViewContextProvider>
  );
}

export function TodosHome({
  userId,
  initialTodos,
}: {
  userId: string;
  initialTodos: Todo[];
}) {
  return <TodosClient userId={userId} initialTodos={initialTodos} />;
}
