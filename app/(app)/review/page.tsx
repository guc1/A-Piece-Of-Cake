import Textarea from '@/components/ui/textarea';

export function ReviewHome() {
  return (
    <section className="grid grid-cols-2 gap-4">
      <div className="pr-4">
        <h2 className="text-xl font-semibold mb-2">Youre rational</h2>
        <Textarea placeholder="Type here" />
        <hr className="my-4" />
        <h2 className="text-xl font-semibold mb-2">guilty pleasure</h2>
        <Textarea placeholder="Type here" />
      </div>
      <div className="border-l pl-4 flex items-center justify-center text-gray-400">
        AI features coming soon...
      </div>
    </section>
  );
}

export default function ReviewPage() {
  return <ReviewHome />;
}
