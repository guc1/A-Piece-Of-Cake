"use client";

import Textarea from '@/components/ui/textarea';
import { useViewContext } from '@/lib/view-context';

export function ReviewHome() {
  const { editable } = useViewContext();
  return (
    <section className="grid h-[calc(100vh-2rem)] grid-cols-2 gap-4 overflow-hidden">
      <div className="flex flex-col overflow-y-auto pr-4">
        <h2 className="mb-2 text-xl font-semibold">Youre rational</h2>
        <Textarea placeholder="Type here" disabled={!editable} />
        <hr className="my-4" />
        <h2 className="mb-2 text-xl font-semibold">guilty pleasure</h2>
        <Textarea placeholder="Type here" disabled={!editable} />
      </div>
      <div className="flex items-center justify-center overflow-y-auto border-l pl-4 text-gray-400">
        AI features coming soon...
      </div>
    </section>
  );
}

export default function ReviewPage() {
  return <ReviewHome />;
}
