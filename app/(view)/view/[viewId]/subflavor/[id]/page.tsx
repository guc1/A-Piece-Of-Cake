/* eslint-disable @next/next/no-img-element */
import { auth } from '@/lib/auth';
import { ensureUser, getUserByViewId } from '@/lib/users';
import { getSubflavor } from '@/lib/subflavors-store';
import { notFound } from 'next/navigation';
import BackButton from '@/components/back-button';

export default async function ViewSubflavorPage({
  params,
}: {
  params: Promise<{ viewId: string; id: string }>;
}) {
  const { viewId, id } = await params;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  const sub = await getSubflavor(String(owner.id), id, viewer?.id || null);
  if (!sub) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-2 p-4">
      <BackButton id={`s7ub-plan-back-${id}-${owner.id}`} />
      <h1 className="text-xl font-semibold">Subflavor info</h1>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{sub.icon}</span>
        <span className="font-medium">{sub.name}</span>
      </div>
      <p className="text-sm">{sub.description}</p>
      <p>Importance ({sub.importance})</p>
      <p>Target % ({sub.targetMix})</p>
      <p>Color: {sub.color}</p>
      <p>Visibility: {sub.visibility}</p>
    </div>
  );
}
