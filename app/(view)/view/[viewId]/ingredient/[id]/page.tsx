/* eslint-disable @next/next/no-img-element */
import { auth } from '@/lib/auth';
import { ensureUser, getUserByViewId } from '@/lib/users';
import { getIngredient } from '@/lib/ingredients-store';
import { notFound } from 'next/navigation';
import BackButton from '@/components/back-button';

function iconSrc(ic: string) {
  if (ic.startsWith('data:')) return ic;
  if (/^[A-Za-z0-9+/=]+$/.test(ic)) return `data:image/png;base64,${ic}`;
  return null;
}

export default async function ViewIngredientPage({
  params,
}: {
  params: Promise<{ viewId: string; id: string }>;
}) {
  const { viewId, id } = await params;
  const owner = await getUserByViewId(viewId);
  if (!owner) notFound();
  const session = await auth();
  const viewer = session ? await ensureUser(session) : null;
  const ing = await getIngredient(String(owner.id), Number(id), viewer?.id || null);
  if (!ing) notFound();
  const src = iconSrc(ing.icon);
  return (
    <div className="mx-auto max-w-xl space-y-2 p-4">
      <BackButton id={`igrd-plan-back-${id}-${owner.id}`} />
      <h1 className="text-xl font-semibold">Edit ingredient</h1>
      <div className="flex items-center gap-2">
        {src ? <img src={src} alt="" className="h-8 w-8" /> : <span className="text-2xl">{ing.icon}</span>}
        <span className="font-medium">{ing.title}</span>
      </div>
      <p className="text-sm">{ing.shortDescription}</p>
      <p>Usefulness ({ing.usefulness})</p>
      <p>What it is: {ing.description}</p>
      <p>Why used: {ing.whyUsed}</p>
      <p>When used / situations: {ing.whenUsed}</p>
      <p>Tips: {ing.tips}</p>
      <p>Visibility: {ing.visibility}</p>
    </div>
  );
}

