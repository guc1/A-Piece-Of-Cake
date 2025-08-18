import { getUserByViewId } from '@/lib/users';
import { listFlavors } from '@/lib/flavors-store';
import { notFound } from 'next/navigation';

export default async function ViewFlavorsPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  const flavors = await listFlavors(String(user.id));
  return (
    <section id={`v13w-flav-${user.id}`} className="space-y-4">
      <h1 className="text-2xl font-bold">Flavors</h1>
      <ul className="list-disc pl-4">
        {flavors.map((f) => (
          <li key={f.id}>{f.name}</li>
        ))}
      </ul>
    </section>
  );
}
