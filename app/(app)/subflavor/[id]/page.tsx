/* eslint-disable @next/next/no-img-element */
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getSubflavor } from '@/lib/subflavors-store';
import { notFound } from 'next/navigation';
import BackButton from '@/components/back-button';

function iconSrc(ic: string) {
  if (ic.startsWith('data:')) return ic;
  if (/^[A-Za-z0-9+/=]+$/.test(ic)) return `data:image/png;base64,${ic}`;
  return null;
}

export default async function SubflavorViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const sub = await getSubflavor(String(me.id), id, me.id);
  if (!sub) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-2 p-4">
      <BackButton id={`s7ub-plan-back-${id}-${me.id}`} />
      <h1 className="text-xl font-semibold">Subflavor info</h1>
      <div className="flex items-center gap-2">
        {iconSrc(sub.icon) ? (
          <img src={iconSrc(sub.icon) as string} alt="" className="h-6 w-6" />
        ) : (
          <span className="text-2xl">{sub.icon}</span>
        )}
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
