'use client';
import Link from 'next/link';

interface ViewLinkProps {
  id: string;
  href: string;
  handle: string;
}

export function ViewLink({ id, href, handle }: ViewLinkProps) {
  return (
    <Link
      id={id}
      href={href}
      className="text-sm underline"
      aria-label={`View @${handle}'s account (read-only)`}
    >
      View
    </Link>
  );
}
