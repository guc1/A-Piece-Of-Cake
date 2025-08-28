'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function BackButton({
  id,
  href,
}: {
  id?: string;
  href?: string;
}) {
  const router = useRouter();
  const handleClick = () => {
    if (href) router.push(href);
    else router.back();
  };
  return (
    <Button id={id} variant="outline" className="mb-4" onClick={handleClick}>
      Back
    </Button>
  );
}
