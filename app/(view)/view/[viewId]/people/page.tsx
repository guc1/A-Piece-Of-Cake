import { auth } from '@/lib/auth';
import { buildViewContext } from '@/lib/profile';
import { getUserByViewId } from '@/lib/users';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';

function ExitButton({ ownerId, viewerId }: { ownerId: number; viewerId: number | null }) {
  'use client';
  const router = useRouter();
  return (
    <Button
      id={`v13w-peep-exit-${ownerId}-${viewerId ?? 0}`}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push('/');
      }}
    >
      Exit viewing and return to my account
    </Button>
  );
}

export default async function ViewPeopleBlocked({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const session = await auth();
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const ctx = buildViewContext({
    ownerId: owner.id,
    viewerId,
    mode: 'viewer',
    viewId,
  });
  return (
    <section
      id={`v13w-peep-block-${ctx.ownerId}-${ctx.viewerId ?? 0}`}
      className="space-y-4"
    >
      <h1 className="text-2xl font-bold">Not possible, for security purposes.</h1>
      <p className="text-sm text-muted-foreground">
        The People tab is disabled while viewing someone else&apos;s account.
      </p>
      <div className="flex gap-2">
        <ExitButton ownerId={ctx.ownerId} viewerId={ctx.viewerId} />
        <Link href={`/view/${viewId}`} className="text-sm underline">
          Go to this profile&apos;s Cake
        </Link>
      </div>
    </section>
  );
}
