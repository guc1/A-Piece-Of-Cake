import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { exitViewing } from './viewer/actions';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect('/');
  }

  const viewing = (session.user as any).originalId;

  return (
    <html lang="en">
      <body>
        <nav className="flex items-center justify-between border-b p-4">
          <ul className="flex gap-4">
            <li><Link href="/">Cake</Link></li>
            <li><Link href="/planning">Planning</Link></li>
            <li><Link href="/flavors">Flavors</Link></li>
            <li><Link href="/ingredients">Ingredients</Link></li>
            <li><Link href="/review">Review</Link></li>
            <li><Link href="/people">People</Link></li>
            <li><Link href="/visibility">Visibility</Link></li>
          </ul>
          <form action="/api/auth/signout" method="post">
            <Button type="submit">Sign out</Button>
          </form>
        </nav>
        <main className="p-4">{children}</main>
        {viewing && (
          <div className="fixed left-4 bottom-4 z-50 flex gap-2">
            <Button variant="outline" disabled>
              Viewer
            </Button>
            <form action={exitViewing}>
              <Button variant="outline">Exit</Button>
            </form>
          </div>
        )}
      </body>
    </html>
  );
}
