import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import { assertOwner } from '@/lib/profile';
import { savePlanChat } from '@/lib/plans-store';

export async function POST(req: Request) {
  const session = await auth();
  const self = await ensureUser(session);
  await assertOwner(self.id, self.id);
  const { date, mode, chatId, messages } = await req.json();
  if (!date || (mode !== 'live' && mode !== 'next')) {
    return new Response('invalid request', { status: 400 });
  }
  await savePlanChat(String(self.id), date, mode, { chatId, messages });
  return Response.json({ ok: true });
}
