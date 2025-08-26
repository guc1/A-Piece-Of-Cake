import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDailyReport, createDailyReport } from '@/lib/daily-report-store';
import { getPlanStrict } from '@/lib/plans-store';
import { DEFAULT_LLM_SETUP } from '@/lib/llm/config';

const SYSTEM_PROMPT = `You are the Cake framework assessment agent. The Cake metaphor: actions add flavors (life domains) via ingredients (habits, rules). The user's ethos sets direction. Compare the day's plan and aim with execution feedback. Note positives, call out issues, and make objective observations. Score the day 0-100, scaling strictness with ambition. Output JSON with keys: summary, good[], bad[], observations[], score.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const today = new Date().toISOString().slice(0, 10);
  const existing = await getDailyReport(userId, today);
  if (existing)
    return NextResponse.json(
      { error: 'Report already generated' },
      { status: 400 },
    );

  const plan = await getPlanStrict(userId, today);
  const context = { date: today, plan };

  const setup = DEFAULT_LLM_SETUP;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing OpenAI API key' },
      { status: 500 },
    );
  }

  const body = {
    model: setup.model,
    temperature: setup.temperature,
    top_p: setup.top_p,
    max_tokens: setup.maxTokens,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(context) },
    ],
    response_format: { type: 'json_object' },
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
    if (!aiRes.ok) {
      return NextResponse.json({ error: raw }, { status: aiRes.status });
    }
    const data = JSON.parse(raw);
    const msg = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(msg);
    } catch {
      parsed = { summary: msg, good: [], bad: [], observations: [], score: 0 };
    }
    const score = Number(parsed.score) || 0;
    await createDailyReport(userId, today, JSON.stringify(parsed), score);
    return NextResponse.json({ report: parsed, score });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
