'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SimpleUser } from '@/lib/people';
import {
  followRequest,
  unfollow,
  acceptFollowRequest,
  declineFollowRequest,
} from '@/lib/people';

interface Props {
  friends: SimpleUser[];
  followers: SimpleUser[];
  discover: SimpleUser[];
  requests: { id: number; handle: string; displayName: string | null; createdAt: string }[];
  activity: { id: number; handle: string; displayName: string | null; createdAt: string; readAt: string | null }[];
}

const tabs = ['friends', 'followers', 'discover', 'inbox'] as const;

export default function PeopleTabs({ friends, followers, discover, requests, activity }: Props) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('friends');
  const [search, setSearch] = useState('');
  const [inboxTab, setInboxTab] = useState<'requests' | 'activity'>('requests');

  let list: SimpleUser[] = [];
  if (tab === 'friends') list = friends;
  if (tab === 'followers') list = followers;
  if (tab === 'discover') list = discover;

  const filtered = list.filter((u) => {
    const term = search.toLowerCase();
    return (
      (u.displayName ?? '').toLowerCase().includes(term) ||
      u.handle.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="flex gap-4 border-b mb-4">
        {tabs.map((t) => (
          <button
            key={t}
            className={`pb-2 ${tab === t ? 'border-b-2 border-black' : 'text-gray-500'}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab !== 'inbox' && (
        <div>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 border p-2 w-full max-w-sm"
          />
          <ul className="space-y-2">
            {filtered.map((u) => (
              <li key={u.id} className="flex items-center justify-between border p-2 rounded">
                <div>
                  <div className="font-bold">{u.displayName ?? u.handle}</div>
                  <div className="text-sm text-gray-600">@{u.handle}</div>
                </div>
                <div>
                  {tab === 'discover' && (
                    <form action={followRequest.bind(null, u.id)}>
                      <Button type="submit">
                        {u.accountVisibility === 'closed' ? 'Request to follow' : 'Follow'}
                      </Button>
                    </form>
                  )}
                  {tab !== 'discover' && (
                    <form action={unfollow.bind(null, u.id)}>
                      <Button type="submit" variant="outline">
                        Unfollow
                      </Button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'inbox' && (
        <div>
          <div className="flex gap-4 border-b mb-4">
            <button
              className={`pb-2 ${inboxTab === 'requests' ? 'border-b-2 border-black' : 'text-gray-500'}`}
              onClick={() => setInboxTab('requests')}
            >
              Requests ({requests.length})
            </button>
            <button
              className={`pb-2 ${inboxTab === 'activity' ? 'border-b-2 border-black' : 'text-gray-500'}`}
              onClick={() => setInboxTab('activity')}
            >
              Activity ({activity.length})
            </button>
          </div>
          {inboxTab === 'requests' && (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between border p-2 rounded">
                  <div>
                    <div className="font-bold">{r.displayName ?? r.handle}</div>
                    <div className="text-sm text-gray-600">@{r.handle}</div>
                  </div>
                  <div className="flex gap-2">
                    <form action={acceptFollowRequest.bind(null, r.id)}>
                      <Button type="submit">Accept</Button>
                    </form>
                    <form action={declineFollowRequest.bind(null, r.id)}>
                      <Button type="submit" variant="outline">
                        Decline
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {inboxTab === 'activity' && (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li key={a.id} className="border p-2 rounded">
                  <span className="font-bold">@{a.handle}</span> accepted your follow request
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
