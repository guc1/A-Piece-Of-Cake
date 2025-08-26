'use client';

import { useState } from 'react';
import { useLogs } from '@/components/dev/logs-provider';

type Message = { role: 'user' | 'assistant'; content: string };

export default function TestChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const { addLog } = useLogs();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    const res = await fetch('/api/testchat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: data.response },
    ]);
    addLog({ request: text, response: data.response });
    setInput('');
  };

  const reset = () => setMessages([]);

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="OpenAI API Key"
          className="flex-1 border rounded px-2"
        />
        <button
          onClick={() => setApiKey('')}
          className="bg-gray-500 text-white px-4 rounded"
        >
          Clear
        </button>
      </div>
      <div className="mb-4 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === 'user' ? 'text-right' : 'text-left'}
          >
            <span
              className={
                m.role === 'user'
                  ? 'bg-orange-100 p-2 rounded inline-block'
                  : 'bg-gray-200 p-2 rounded inline-block'
              }
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-2"
        />
        <button
          onClick={sendMessage}
          className="bg-orange-500 text-white px-4 rounded"
        >
          Send
        </button>
        <button onClick={reset} className="bg-gray-500 text-white px-4 rounded">
          Reset
        </button>
      </div>
    </div>
  );
}
