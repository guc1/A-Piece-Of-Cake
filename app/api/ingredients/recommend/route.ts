import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DEFAULT_LLM_SETUP, withOverrides } from '@/lib/llm/config';
import { createIngredient } from '@/lib/ingredients-store';

export async function POST(req: NextRequest) {
  const { messages, overrides, chatId } = await req.json();
  console.log('ingredient recommend request', chatId, messages);

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

  const base = {
    model: setup.model,
    temperature: setup.temperature,
    top_p: setup.top_p,
    max_tokens: setup.maxTokens,
  };

  const body = {
    ...base,
    messages,
    tools: [
      {
        type: 'function',
        function: {
          name: 'create_ingredient',
          description: 'Create an ingredient for the user',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              shortDescription: { type: 'string' },
              usefulness: { type: 'number' },
              description: { type: 'string' },
              whyUsed: { type: 'string' },
              whenUsed: { type: 'string' },
              tips: { type: 'string' },
            },
            required: ['title', 'shortDescription', 'usefulness'],
          },
        },
      },
    ],
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

    if (msg?.tool_calls?.length) {
      const tc = msg.tool_calls[0];
      if (tc.function?.name === 'create_ingredient') {
        const args = JSON.parse(tc.function.arguments || '{}');
        const ingredient = await createIngredient(String(userId), {
          title: args.title,
          shortDescription: args.shortDescription || '',
          usefulness:
            typeof args.usefulness === 'number' ? args.usefulness : 50,
          description: args.description || '',
          whyUsed: args.whyUsed || '',
          whenUsed: args.whenUsed || '',
          tips: args.tips || '',
          imageUrl: null,
          icon: '🤖',
          tags: null,
          visibility: 'private',
        });
        const toolMsg = {
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({ status: 'created' }),
        };
        const followBody = {
          ...base,
          messages: [...messages, msg, toolMsg],
        } as any;
        const finalRes = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(followBody),
          },
        );
        const finalRaw = await finalRes.text();
        if (!finalRes.ok) {
          return NextResponse.json(
            { error: finalRaw },
            { status: finalRes.status },
          );
        }
        const finalData = JSON.parse(finalRaw);
        const finalResponse =
          finalData.choices?.[0]?.message?.content ?? '';
        console.log('ingredient recommend response', finalResponse);
        return NextResponse.json({ response: finalResponse, ingredient });
      }
    }

    const response = msg?.content ?? '';
    console.log('ingredient recommend response', response);
    return NextResponse.json({ response });
  } catch (e: any) {
    console.error('ingredient recommend error', e);
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
