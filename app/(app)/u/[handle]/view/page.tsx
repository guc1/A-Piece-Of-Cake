import { db } from '@/lib/db';
import { users, follows } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { listFlavors } from '@/lib/flavors-store';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Flavor } from '@/types/flavor';

export default async function ViewAccountPage({
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
  let inbound: 'accepted' | 'pending' | null = null;
  if (viewerId) {
    if (viewerId === user.id) {
      relation = 'self';
    } else {
      const [outgoing] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, viewerId),
            eq(follows.followingId, user.id),
          ),
        );
      if (outgoing) relation = outgoing.status as 'accepted' | 'pending';
      const [incoming] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, user.id),
            eq(follows.followingId, viewerId),
          ),
        );
      if (incoming) inbound = incoming.status as 'accepted' | 'pending';
    }
  }

  const canViewAccount =
    user.accountVisibility === 'open' ||
    relation === 'accepted' ||
    relation === 'self';

  if (!canViewAccount) {
    notFound();
  }

  const flavors = await listFlavors(String(user.id));
  const isFriend = relation === 'accepted' && inbound === 'accepted';
  const isFollower = relation === 'accepted';
  const visibleFlavors: Flavor[] = flavors.filter((f) => {
    if (relation === 'self') return true;
    switch (f.visibility) {
      case 'public':
        return true;
      case 'followers':
        return isFollower;
      case 'friends':
        return isFriend;
      default:
        return false;
    }
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{user.displayName ?? user.handle}</h1>
      <p>@{user.handle}</p>
      <div>
        <h2 className="text-xl font-semibold mb-2">Flavors</h2>
        {visibleFlavors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No flavors to show.</p>
        ) : (
          <ul className="space-y-2">
            {visibleFlavors.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <span>{f.icon}</span>
                <span>{f.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
