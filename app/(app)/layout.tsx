import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect('/');
  }

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <nav className="flex items-center justify-between border-b p-4">
          <ul className="flex gap-4">
            <li>
              <Link href="/">Cake</Link>
            </li>
            <li>
              <Link href="/planning">Planning</Link>
            </li>
            <li>
              <Link href="/flavors">Flavors</Link>
            </li>
            <li>
              <Link href="/ingredients">Ingredients</Link>
            </li>
            <li>
              <Link href="/review">Review</Link>
            </li>
            <li>
              <Link href="/people">People</Link>
            </li>
            <li>
              <Link href="/visibility">Visibility</Link>
            </li>
          </ul>
          <form action="/api/auth/signout" method="post">
            <Button type="submit">Sign out</Button>
          </form>
        </nav>
        <main className="flex flex-1 flex-col p-4">{children}</main>
      </body>
    </html>
  );
}
