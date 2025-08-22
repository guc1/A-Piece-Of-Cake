/* eslint-disable @next/next/no-img-element */
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { getIngredient } from '@/lib/ingredients-store';
import { notFound } from 'next/navigation';

function iconSrc(ic: string) {
  if (ic.startsWith('data:')) return ic;
  if (/^[A-Za-z0-9+/=]+$/.test(ic)) return `data:image/png;base64,${ic}`;
  return null;
}

export default async function IngredientViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) notFound();
  const me = await ensureUser(session);
  const ing = await getIngredient(String(me.id), Number(id), me.id);
  if (!ing) notFound();
  const src = iconSrc(ing.icon);
  return (
    <div className="mx-auto max-w-xl space-y-2 p-4">
      <h1 className="text-xl font-semibold">Edit ingredient</h1>
      <div className="flex items-center gap-2">
        {src ? (
          <img src={src} alt="" className="h-8 w-8" />
        ) : (
          <span className="text-2xl">{ing.icon}</span>
        )}
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

