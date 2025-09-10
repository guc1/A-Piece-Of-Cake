import { db } from './db';
import { todos, todoRevisions, follows } from './db/schema';
import { eq, and, desc, lte } from 'drizzle-orm';
import type { Todo, TodoInput, Visibility } from '@/types/todo';

function sortTodos(list: Todo[]) {
  return list.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function toTodo(row: typeof todos.$inferSelect): Todo {
  return {
    id: row.id,
    userId: row.userId ?? 0,
    title: row.title ?? '',
    description: row.description ?? '',
    priority: row.priority ?? 0,
    icon: row.icon ?? '✅',
    visibility: (row.visibility as Visibility) ?? 'public',
    completed: row.completed ?? false,
    dueAt: row.dueAt?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

async function canView(
  viewerId: number | null,
  ownerId: number,
  vis: Visibility,
) {
  if (viewerId === ownerId) return true;
  switch (vis) {
    case 'public':
      return true;
    case 'followers':
      if (!viewerId) return false;
      const [f1] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, viewerId),
            eq(follows.followingId, ownerId),
          ),
        );
      return !!f1 && f1.status === 'accepted';
    case 'friends':
      if (!viewerId) return false;
      const [f2] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, viewerId),
            eq(follows.followingId, ownerId),
          ),
        );
      const [f3] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, ownerId),
            eq(follows.followingId, viewerId),
          ),
        );
      return f2?.status === 'accepted' && f3?.status === 'accepted';
    case 'private':
    default:
      return false;
  }
}

export async function listTodos(
  userId: string,
  viewerId: number | null = null,
  at?: Date,
): Promise<Todo[]> {
  const rows = await db
    .select()
    .from(todos)
    .where(eq(todos.userId, Number(userId)));
  const list: Todo[] = [];
  for (const row of rows) {
    if (
      !(await canView(
        viewerId,
        row.userId ?? 0,
        (row.visibility as Visibility) ?? 'public',
      ))
    )
      continue;
    let base = toTodo(row);
    if (at) {
      const [rev] = await db
        .select()
        .from(todoRevisions)
        .where(
          and(
            eq(todoRevisions.todoId, row.id),
            lte(todoRevisions.snapshotAt, at),
          ),
        )
        .orderBy(desc(todoRevisions.snapshotAt))
        .limit(1);
      if (rev) {
        base = { ...base, ...(rev.payload as any) };
      }
    }
    list.push(base);
  }
  return sortTodos(list);
}

export async function getTodo(
  userId: string,
  id: number,
  viewerId: number | null = null,
  at?: Date,
): Promise<Todo | null> {
  const [row] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.userId, Number(userId)), eq(todos.id, id)));
  if (!row) return null;
  if (
    !(await canView(
      viewerId,
      row.userId ?? 0,
      (row.visibility as Visibility) ?? 'public',
    ))
  )
    return null;
  let base = toTodo(row);
  if (at) {
    const [rev] = await db
      .select()
      .from(todoRevisions)
      .where(
        and(
          eq(todoRevisions.todoId, row.id),
          lte(todoRevisions.snapshotAt, at),
        ),
      )
      .orderBy(desc(todoRevisions.snapshotAt))
      .limit(1);
    if (rev) {
      base = { ...base, ...(rev.payload as any) };
    }
  }
  return base;
}

export async function createTodo(
  userId: string,
  input: TodoInput,
): Promise<Todo> {
  const now = new Date();
  const [row] = await db
    .insert(todos)
    .values({
      userId: Number(userId),
      title: input.title.slice(0, 80),
      description: input.description,
      priority: clamp(input.priority),
      icon: input.icon,
      visibility: input.visibility ?? 'public',
      completed: input.completed ?? false,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const todo = toTodo(row);
  await db.insert(todoRevisions).values({
    todoId: todo.id,
    payload: {
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      icon: todo.icon,
      completed: todo.completed,
      dueAt: todo.dueAt,
    },
  });
  return todo;
}

export async function updateTodo(
  userId: string,
  id: number,
  input: Partial<TodoInput>,
): Promise<Todo | null> {
  const now = new Date();
  const [row] = await db
    .update(todos)
    .set({
      title: input.title ? input.title.slice(0, 80) : undefined,
      description: input.description,
      priority:
        input.priority !== undefined ? clamp(input.priority) : undefined,
      icon: input.icon,
      visibility: input.visibility,
      completed: input.completed !== undefined ? input.completed : undefined,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      updatedAt: now,
    })
    .where(and(eq(todos.userId, Number(userId)), eq(todos.id, id)))
    .returning();
  if (!row) return null;
  const todo = toTodo(row);
  await db.insert(todoRevisions).values({
    todoId: todo.id,
    payload: {
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      icon: todo.icon,
      completed: todo.completed,
      dueAt: todo.dueAt,
    },
  });
  return todo;
}

export async function deleteTodo(userId: string, id: number): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [exists] = await tx
      .select({ id: todos.id })
      .from(todos)
      .where(and(eq(todos.userId, Number(userId)), eq(todos.id, id)))
      .limit(1);
    if (!exists) return false;
    await tx.delete(todoRevisions).where(eq(todoRevisions.todoId, id));
    await tx
      .delete(todos)
      .where(and(eq(todos.userId, Number(userId)), eq(todos.id, id)));
    return true;
  });
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
