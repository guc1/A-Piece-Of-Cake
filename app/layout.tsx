import './globals.css';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const offsetStr = cookieStore.get('timeOffset')?.value;
  const RealDate = (globalThis as any)._realDate || Date;
  (globalThis as any)._realDate = RealDate;
  if (offsetStr) {
    const offset = parseInt(offsetStr, 10);
    if (!isNaN(offset)) {
      class MockDate extends RealDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(RealDate.now() + offset);
          } else {
            // @ts-ignore -- spread args for Date constructor
            super(...args);
          }
        }
        static now() {
          return RealDate.now() + offset;
        }
      }
      // override for this request
      // @ts-ignore
      globalThis.Date = MockDate as unknown as DateConstructor;
    } else {
      // @ts-ignore
      globalThis.Date = RealDate as unknown as DateConstructor;
    }
  } else {
    // @ts-ignore
    globalThis.Date = RealDate as unknown as DateConstructor;
  }

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  const RealDate = Date;
  globalThis._realDate = RealDate;
  const offsetStr = localStorage.getItem('timeOffset');
  if (offsetStr) {
    const offset = parseInt(offsetStr, 10);
    if (!isNaN(offset)) {
      class MockDate extends RealDate {
        constructor(...args) {
          if (args.length === 0) {
            super(RealDate.now() + offset);
          } else {
            // @ts-ignore -- spread args for Date constructor
            super(...args);
          }
        }
        static now() {
          return RealDate.now() + offset;
        }
      }
      globalThis.Date = MockDate;
    }
  }
})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
