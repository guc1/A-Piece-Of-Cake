/* eslint-disable @next/next/no-img-element */
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getFlavor } from '@/lib/flavors-store';
import { notFound } from 'next/navigation';
import BackButton from '@/components/back-button';

export default async function FlavorViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const fl = await getFlavor(String(me.id), id, me.id);
  if (!fl) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-2 p-4">
      <BackButton id={`f7av-plan-back-${id}-${me.id}`} />
      <h1 className="text-xl font-semibold">Flavor info</h1>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{fl.icon}</span>
        <span className="font-medium">{fl.name}</span>
      </div>
      <p className="text-sm">{fl.description}</p>
      <p>Importance ({fl.importance})</p>
      <p>Target % ({fl.targetMix})</p>
      <p>Color: {fl.color}</p>
      <p>Visibility: {fl.visibility}</p>
    </div>
  );
}
