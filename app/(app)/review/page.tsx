import Textarea from '@/components/ui/textarea';
import { useViewContext } from '@/lib/view-context';

export function ReviewHome() {
  const { editable } = useViewContext();
  return (
    <section className="grid h-screen grid-cols-2 gap-4">
      <div className="h-full overflow-y-auto pr-4">
        <h2 className="mb-2 text-xl font-semibold">Youre rational</h2>
        <Textarea placeholder="Type here" disabled={!editable} />
        <hr className="my-4" />
        <h2 className="mb-2 text-xl font-semibold">guilty pleasure</h2>
        <Textarea placeholder="Type here" disabled={!editable} />
      </div>
      <div className="h-full overflow-y-auto border-l pl-4 flex items-center justify-center text-gray-400">
        AI features coming soon...
      </div>
    </section>
  );
}

export default function ReviewPage() {
  return <ReviewHome />;
}
