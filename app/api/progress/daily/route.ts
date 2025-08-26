import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DEFAULT_LLM_SETUP, withOverrides } from '@/lib/llm/config';
import { saveDailyReport, getDailyReport } from '@/lib/daily-reports';
import { getTodayPlanContext } from '@/lib/progress-context';

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayIso = new Date().toLocaleDateString('en-CA');
  const existing = await getDailyReport(userId, todayIso);
  if (existing) {
    return NextResponse.json(
      { error: 'Report already exists', score: existing.score },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing OpenAI API key' },
      { status: 500 },
    );
  }

  const context = await getTodayPlanContext(userId, todayIso);

  const systemPrompt =
    'You are a fair but strict assessment agent for the Piece of Cake framework. ' +
    "Evaluate how the user's day aligned with their ethos, daily aim, and activities. " +
    'Return JSON with keys good, bad, observations, planning, execution, and score (0-100).';

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify(context) },
  ];

  console.log('daily report request', messages);

  const setup = withOverrides(DEFAULT_LLM_SETUP, {});

  const body = {
    model: setup.model,
    temperature: setup.temperature,
    top_p: setup.top_p,
    max_tokens: setup.maxTokens,
    response_format: { type: 'json_object' },
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
    const raw = await aiRes.text();
    console.log('daily report raw response', raw);
    if (!aiRes.ok) {
      return NextResponse.json({ error: raw }, { status: aiRes.status });
    }
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON from model' },
        { status: 500 },
      );
    }
    const score = Number(parsed.score ?? 0);
    await saveDailyReport(userId, todayIso, score, parsed);
    return NextResponse.json({ score, report: parsed });
  } catch (e: any) {
    console.error('daily report error', e);
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
