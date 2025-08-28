import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import { getLatestHeadingReport } from '@/lib/heading-report-store';
import { ReviewHome } from './client';

export default async function ReviewPage() {
  const session = await auth();
  if (!session) redirect('/signin');
  const me = await ensureUser(session);
  const report = await getLatestHeadingReport(me.id);
  return <ReviewHome userId={me.id} initialReport={report} />;
}
