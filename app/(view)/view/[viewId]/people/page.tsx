import { auth } from '@/lib/auth';
import { buildViewContext, type ViewContext } from '@/lib/profile';
import { getUserByViewId } from '@/lib/users';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';

function ExitButtons({ ctx }: { ctx: ViewContext }) {
  'use client';
  const router = useRouter();
  return (
    <div className="mt-4 flex gap-4">
      <button
        id={`v13w-peep-exit-${ctx.ownerId}-${ctx.viewerId || 0}`}
        onClick={() => {
          const prev = document.referrer;
          if (prev && !prev.includes('/view/')) router.back();
          else router.push('/');
        }}
        aria-label="Exit viewing and return to my account"
        className="rounded border px-3 py-1"
      >
        Exit
      </button>
      <Link
        href={`/view/${ctx.viewId}`}
        className="rounded border px-3 py-1 underline"
      >
        Go to this profile’s Cake
      </Link>
    </div>
  );
}

export default async function ViewPeopleBlockedPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const session = await auth();
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  const ctx = buildViewContext({
    ownerId: owner.id,
    viewerId,
    mode: 'viewer',
    viewId,
  });
  return (
    <section
      id={`v13w-peep-block-${ctx.ownerId}-${ctx.viewerId || 0}`}
      className="space-y-2"
    >
      <h1 className="text-lg font-semibold">
        Not possible, for security purposes.
      </h1>
      <p className="text-sm text-gray-500">
        The People tab is disabled while viewing someone else&apos;s account.
      </p>
      <ExitButtons ctx={ctx} />
    </section>
  );
}

