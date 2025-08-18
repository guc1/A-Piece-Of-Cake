'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ViewerBanner({ exitHref = '/' }: { exitHref?: string }) {
  return (
    <div className="fixed left-4 top-4 z-50 flex gap-2">
      <Button variant="outline" size="sm" disabled>
        Viewer
      </Button>
      <Link href={exitHref}>
        <Button size="sm">Exit</Button>
      </Link>
    </div>
  );
}
