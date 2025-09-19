import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createYearlyReport } from '@/lib/yearly-report-store';
import { listMonthlyReports } from '@/lib/monthly-report-store';
import { DEFAULT_LLM_SETUP } from '@/lib/llm/config';
import { getCoachTonePrompt } from '@/lib/ai/coach-tone';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildSystemPrompt(toneId: string, customInstructions: string) {
  const toneDescription = getCoachTonePrompt(toneId, customInstructions);
  return `You are the yearly Assessment agent for the Piece of Cake framework, you will receive context from every month on how the user had performed that month, your goal is to evaluate the week and output an assessment based on it. Flavors are life domains and ingredients are the habits that add them; when combined, the flavors form the user's Cake—their ethos—which guides direction without a fixed destination.Evaluate the provided months: judge the plan's difficulty, focus, and potential they had on the day, then how execution aligned with it. Be firm yet fair—higher ambitions merit tougher grading, acknowledge wins, and call out self-sabotage, also provide an analysis how the progress was thru the year, include this in summary. The tone of your assessment should be: ${toneDescription} Keep the tone wise and constructive.Respond ONLY with JSON of the form {"summary":string,"good":string[],"bad":string[],"observations":string[],"score":0-100}.`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const paramUserId = Number(req.nextUrl.searchParams.get('userId'));
  const userId = paramUserId || Number(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const start = body.startDate || body.start;
  const end = body.endDate || body.end;
  const ethos = body.ethos || '';
  if (!start) return NextResponse.json({ error: 'Missing date range' }, { status: 400 });

  const [userRow, monthly] = await Promise.all([
    db
      .select({
        coachTone: users.coachTone,
        coachToneCustom: users.coachToneCustom,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId)),
    listMonthlyReports(userId),
  ]);
  const toneId = body.toneId || userRow?.[0]?.coachTone || 'tone_medium';
  const storedCustom = (userRow?.[0]?.coachToneCustom ?? '').trim();
  const toneCustom =
    toneId === 'tone_custom' && storedCustom ? storedCustom : '';
  const promptToneId =
    toneId === 'tone_custom' && !toneCustom ? 'tone_medium' : toneId;
  const userCreated = userRow?.[0]?.createdAt
    ? toYMD(new Date(userRow[0].createdAt))
    : null;

  const yearStart = new Date(start);
  const yearEnd = end ? new Date(end) : new Date(Date.UTC(yearStart.getUTCFullYear(), 11, 31));
  const startStr = toYMD(yearStart);
  const endStr = toYMD(yearEnd);

  const monthlyMap = new Map(monthly.map((m) => [m.startDate.slice(0, 7), m]));

  const lines: string[] = [];
  lines.push(`the life ethos/goal of the person is: ${ethos}`);
  lines.push("This is the context one which you have to base you're assessment:");

  for (let i = 0; i < 12; i++) {
    const mStart = new Date(Date.UTC(yearStart.getUTCFullYear(), i, 1));
    const mEnd = new Date(Date.UTC(yearStart.getUTCFullYear(), i + 1, 0));
    const key = mStart.toISOString().slice(0, 7);
    const rpt = monthlyMap.get(key);
    lines.push(`${toYMD(mStart)} - ${toYMD(mEnd)}`);
    if (rpt) {
      lines.push(`summary: ${rpt.summary}`);
      if (rpt.good.length) lines.push(`good: ${rpt.good.join('; ')}`);
      if (rpt.bad.length) lines.push(`bad: ${rpt.bad.join('; ')}`);
      if (rpt.observations.length)
        lines.push(`observations: ${rpt.observations.join('; ')}`);
      lines.push(`score: ${rpt.score}`);
    } else {
      lines.push('No Assessment');
      if (userCreated && toYMD(mEnd) < userCreated) {
        lines.push('The user did not have an account on this month yet.');
      } else {
        lines.push('This month the user did not generate a monthly assessment.');
      }
    }
    lines.push('-----------------');
  }

  const context = lines.join('\n');
  const setup = DEFAULT_LLM_SETUP;
  const systemPrompt = buildSystemPrompt(promptToneId, toneCustom);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
  }
  const reqBody = {
    model: setup.model,
    temperature: setup.temperature,
    top_p: setup.top_p,
    max_tokens: setup.maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: context },
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
      body: JSON.stringify(reqBody),
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
    const content = {
      summary: parsed.summary || '',
      good: Array.isArray(parsed.good) ? parsed.good : [],
      bad: Array.isArray(parsed.bad) ? parsed.bad : [],
      observations: Array.isArray(parsed.observations)
        ? parsed.observations
        : [],
    };
    await createYearlyReport(
      userId,
      startStr,
      endStr,
      content,
      score,
      toneId,
      toneCustom,
    );
    console.log('yearly report saved', {
      userId,
      start: startStr,
      end: endStr,
      score,
      toneId,
      customInstructionsUsed: Boolean(toneCustom),
    });
    return NextResponse.json({
      report: parsed,
      score,
      context,
      toneId,
      toneCustom,
    });
  } catch (e: any) {
    console.error('yearly-report generation failed', e);
    return NextResponse.json(
      {
        error: e.message || 'LLM request failed',
        cause: e?.cause?.message,
        context,
      },
      { status: 500 },
    );
  }
}
