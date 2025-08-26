'use client';
import { useState } from 'react';
import { useLogs } from '@/components/logs-provider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function TestChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { addLog } = useLogs();

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    const res = await fetch('/api/testchat', {
      method: 'POST',
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    const reply = data.reply as string;
    const aiMsg: Message = { role: 'assistant', content: reply };
    setMessages((prev) => [...prev, aiMsg]);
    addLog({ request: input, response: reply });
    setInput('');
  }

  function reset() {
    setMessages([]);
  }

  return (
    <div className="p-4">
      <div className="mb-4 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === 'user' ? 'text-right' : 'text-left'}
          >
            <span className="inline-block rounded px-2 py-1 bg-gray-200">
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow border px-2 py-1"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Send
        </button>
        <button
          onClick={reset}
          className="bg-gray-500 text-white px-4 py-1 rounded"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
