import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, follows } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { listFlavors } from '@/lib/flavors-store';
import { ViewerBanner } from '@/components/viewer-banner';

export default async function ViewProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const session = await auth();
  const viewerId = Number(session?.user?.id);
  const { handle } = await params;

  const [user] = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      accountVisibility: users.accountVisibility,
    })
    .from(users)
    .where(eq(users.handle, handle));

  if (!user) notFound();

  if (user.accountVisibility === 'private' && viewerId !== user.id) {
    notFound();
  }

  let relation: 'self' | 'accepted' | 'pending' | 'none' = 'none';
  if (viewerId) {
    if (viewerId === user.id) {
      relation = 'self';
    } else {
      const [outgoing] = await db
        .select()
        .from(follows)
        .where(
          and(eq(follows.followerId, viewerId), eq(follows.followingId, user.id)),
        );
      if (outgoing) relation = outgoing.status as 'accepted' | 'pending';
    }
  }

  if (
    user.accountVisibility === 'closed' &&
    viewerId !== user.id &&
    relation !== 'accepted'
  ) {
    notFound();
  }

  const flavors = await listFlavors(user.id.toString());

  return (
    <section className="relative space-y-4">
      <ViewerBanner exitHref="/" />
      <h1 className="text-2xl font-bold">{user.displayName ?? user.handle}</h1>
      <p>@{user.handle}</p>
      <h2 className="text-xl font-semibold">Flavors</h2>
      {flavors.length > 0 ? (
        <ul className="space-y-2">
          {flavors.map((f) => (
            <li key={f.id} className="flex items-center gap-2">
              <span>{f.icon}</span>
              <span>{f.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No flavors yet.</p>
      )}
    </section>
  );
}
