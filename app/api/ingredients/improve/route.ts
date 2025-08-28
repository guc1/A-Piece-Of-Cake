import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DEFAULT_LLM_SETUP, withOverrides } from '@/lib/llm/config';

export async function POST(req: NextRequest) {
  const { messages, overrides, chatId } = await req.json();
  console.log('ingredient improve request', chatId, messages);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing OpenAI API key' },
      { status: 500 },
    );
  }

  const setup = withOverrides(DEFAULT_LLM_SETUP, overrides);

  const body = {
    model: setup.model,
    temperature: setup.temperature,
    top_p: setup.top_p,
    max_tokens: setup.maxTokens,
    messages,
  } as any;

  try {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const rawResponse = await aiRes.text();

    if (!aiRes.ok) {
      return NextResponse.json(
        { error: rawResponse },
        { status: aiRes.status },
      );
    }

    const data = JSON.parse(rawResponse);
    const choice = data.choices?.[0];
    const msg = choice?.message;
    const response = msg?.content ?? '';
    console.log('ingredient improve response', response);
    return NextResponse.json({ response });
  } catch (e: any) {
    console.error('ingredient improve error', e);
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
