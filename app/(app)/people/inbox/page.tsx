import { db } from '@/lib/db';
import { follows, notifications, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { acceptFollowRequest, declineFollowRequest } from '../actions';
import { eq, and } from 'drizzle-orm';
import { Button } from '@/components/ui/button';

export default async function InboxPage() {
  const session = await auth();
  const me = Number(session?.user?.id);
  if (!me) {
    return (
      <section>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p>Please sign in.</p>
      </section>
    );
  }

  const requests = await db
    .select({
      id: follows.followerId,
      handle: users.handle,
      displayName: users.displayName,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followerId))
    .where(and(eq(follows.followingId, me), eq(follows.status, 'pending')));

  const activity = await db
    .select({
      id: notifications.id,
      handle: users.handle,
      displayName: users.displayName,
    })
    .from(notifications)
    .innerJoin(users, eq(users.id, notifications.fromUserId))
    .where(
      and(eq(notifications.toUserId, me), eq(notifications.type, 'follow_accepted')),
    );

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold">Inbox</h1>
      <div>
        <h2 className="text-xl font-semibold mb-2">Requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests.</p>
        ) : (
          <ul className="divide-y">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-semibold">{r.displayName ?? r.handle}</div>
                  <div className="text-sm text-muted-foreground">@{r.handle}</div>
                </div>
                <div className="flex gap-2">
                  <form action={acceptFollowRequest.bind(null, r.id)}>
                    <Button size="sm">Accept</Button>
                  </form>
                  <form action={declineFollowRequest.bind(null, r.id)}>
                    <Button variant="outline" size="sm">
                      Decline
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity.</p>
        ) : (
          <ul className="divide-y">
            {activity.map((a) => (
              <li key={a.id} className="py-2">
                <div className="text-sm">
                  <span className="font-semibold">@{a.handle}</span> accepted your follow
                  request
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
