import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DEFAULT_LLM_SETUP, withOverrides } from '@/lib/llm/config';

function parseAssignments(str: string) {
  try {
    const arr = JSON.parse(str);
    return Array.isArray(arr) ? arr : null;
  } catch {
    try {
      const m = str.match(/```json\s*([\s\S]*?)\s*```/i);
      if (m) {
        const arr = JSON.parse(m[1]);
        return Array.isArray(arr) ? arr : null;
      }
    } catch {
      return null;
    }
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { activities, presets, overrides } = await req.json();

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

  const presetList = Array.isArray(presets)
    ? presets.map((p: any) => `${p.id}: ${p.name} (${p.color})`).join('\n')
    : '';
  const activityList = Array.isArray(activities)
    ? activities
        .map(
          (a: any) => `${a.Activity ?? a.title}: ${a.Description ?? a.description ?? ''}`,
        )
        .join('\n')
    : '';

  const messages = [
    {
      role: 'system',
      content:
        'You are a colour assessment agent. Choose the most compatible color preset ID from the provided list for each activity. Respond with a JSON array like [{"activity":"<title>","presetId":"<id>"}]. Only use preset IDs from the list.',
    },
    {
      role: 'user',
      content: `Color presets:\n${presetList}\n\nActivities:\n${activityList}`,
    },
  ];

  try {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: setup.model,
        temperature: setup.temperature,
        top_p: setup.top_p,
        max_tokens: setup.maxTokens,
        messages,
      }),
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
    const parsed = parseAssignments(response) || [];
    return NextResponse.json({ assignments: parsed });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
