import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { NavBar } from '@/components/nav-bar';

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
      <body>
        <NavBar />
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
