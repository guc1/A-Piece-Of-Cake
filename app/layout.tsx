import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  const RealDate = Date;
  globalThis._realDate = RealDate;
  const match = document.cookie.match(/(?:^|; )timeOffset=([^;]+)/);
  const offsetStr = localStorage.getItem('timeOffset') || (match ? match[1] : null);
  if (offsetStr) {
    const offset = parseInt(offsetStr, 10);
    if (!isNaN(offset)) {
      if (!match) document.cookie = 'timeOffset=' + offset + '; path=/';
      class MockDate extends RealDate {
        constructor(...args) {
          if (args.length === 0) {
            super(RealDate.now() + offset);
          } else {
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
