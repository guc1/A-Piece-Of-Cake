import { auth } from '@/lib/auth';
import { getFriends, getFollowers, getDiscover, getInbox } from '@/lib/people';
import PeopleTabs from './people-tabs';

export default async function PeoplePage() {
  const session = await auth();
  const userId = Number((session as any)?.user?.id);
  const [friends, followers, discover, inbox] = await Promise.all([
    getFriends(userId),
    getFollowers(userId),
    getDiscover(userId),
    getInbox(userId),
  ]);
  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold mb-4">People</h1>
      <PeopleTabs
        friends={friends}
        followers={followers}
        discover={discover}
        requests={inbox.requests}
        activity={inbox.activity}
      />
    </section>
  );
}
