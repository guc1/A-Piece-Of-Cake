import { getUserByViewId } from '@/lib/users';
import { notFound } from 'next/navigation';

export default async function ViewPeoplePage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const user = await getUserByViewId(viewId);
  if (!user) notFound();
  return (
    <section id={`v13w-peep-${user.id}`} className="space-y-4">
      <h1 className="text-2xl font-bold">People</h1>
      <p>Not accessible for safety reasons.</p>
    </section>
  );
}
