'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function BackButton({ id }: { id?: string }) {
  const router = useRouter();
  return (
    <Button id={id} variant="outline" className="mb-4" onClick={() => router.back()}>
      Back
    </Button>
  );
}

