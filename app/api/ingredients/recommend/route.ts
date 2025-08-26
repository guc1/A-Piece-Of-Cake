import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LLM_SETUP, withOverrides } from '@/lib/llm/config';

export async function POST(req: NextRequest) {
  const { messages, overrides } = await req.json();
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
    messages,
    temperature: setup.temperature,
    top_p: setup.top_p,
    max_tokens: setup.maxTokens,
  };

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
    const response = data.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ response });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
