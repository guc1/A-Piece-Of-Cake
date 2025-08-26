import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const auth = req.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
  }
  const apiKey = auth.replace('Bearer ', '').trim();
  try {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [{ role: 'user', content: message }],
      }),
    });
    if (!aiRes.ok) {
      const err = await aiRes.text();
      return NextResponse.json({ error: err }, { status: aiRes.status });
    }
    const data = await aiRes.json();
    const response = data.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ response });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
