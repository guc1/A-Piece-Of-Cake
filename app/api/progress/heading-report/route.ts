import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createHeadingReport } from '@/lib/heading-report-store';
import { listDailyReports } from '@/lib/daily-report-store';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { listMonthlyReports } from '@/lib/monthly-report-store';
import { listYearlyReports } from '@/lib/yearly-report-store';
import { DEFAULT_LLM_SETUP } from '@/lib/llm/config';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function buildSystemPrompt(toneId: string) {
  const tone = getCoachTone(toneId);
  return `You are a helpful assistant in the Piece of Cake framework that will describe and evaluate the direction the person is going in his or her life. Piece of Cake is a framework that paints flavors as goals in different life domains, achieved through ingredients which are habits. These flavors combine into a cake—the shape, size, and taste of your life. Every person wants a different cake, but what matters most is the direction rather than the current position. Your goal is to output a structured result. Respond ONLY with JSON of the form {"Overview":string,"short-term":string[],"long-term":string[],"feedback":string[],"score-progress":0-100,"score-probability":0-100}. The tone of your assessment should be: ${JSON.stringify(tone, null, 2)} Keep the tone wise and constructive.`;
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const paramUserId = Number(req.nextUrl.searchParams.get('userId'));
  const userId = paramUserId || Number(session?.user?.id);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const date = body.date || toYMD(new Date());
  const rational = body.rational || '';
  const guilty = body.guilty || '';

  const [userRow] = await db
    .select({ coachTone: users.coachTone, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId));
  const toneId = body.toneId || userRow?.coachTone || 'tone_medium';
  const userCreated = userRow?.createdAt
    ? toYMD(new Date(userRow.createdAt))
    : null;

  const [daily, weekly, monthly, yearly] = await Promise.all([
    listDailyReports(userId),
    listWeeklyReports(userId),
    listMonthlyReports(userId),
    listYearlyReports(userId),
  ]);
  const dailyMap = new Map(daily.map((r) => [r.date, r]));

  const targetDate = new Date(date);
  const lines: string[] = [];
  lines.push(
    `this is the rational/goals/life ethos the user wants to reach {rational: ${rational}; guilty pleasure: ${guilty}} here is the context of how the user is performing:`,
  );
  lines.push('***last 4 day reports***:');
  for (let i = 0; i < 4; i++) {
    const d = new Date(targetDate);
    d.setUTCDate(targetDate.getUTCDate() - i);
    const ymd = toYMD(d);
    const rpt = dailyMap.get(ymd);
    lines.push(ymd);
    if (rpt) {
      lines.push(`summary: ${rpt.summary}`);
      if (rpt.good.length) lines.push(`good: ${rpt.good.join('; ')}`);
      if (rpt.bad.length) lines.push(`bad: ${rpt.bad.join('; ')}`);
      if (rpt.observations.length)
        lines.push(`observations: ${rpt.observations.join('; ')}`);
      lines.push(`score: ${rpt.score}`);
    } else {
      lines.push('This day the user did not generate a daily assessment.');
      if (userCreated && ymd < userCreated) {
        lines.push('The user did not have an account on this day yet.');
      }
    }
    lines.push('-----------------');
  }

  lines.push('here are the last 2 week reports:');
  weekly.slice(0, 2).forEach((r) => {
    lines.push(`${r.startDate} to ${r.endDate}`);
    lines.push(`summary: ${r.summary}`);
    if (r.good.length) lines.push(`good: ${r.good.join('; ')}`);
    if (r.bad.length) lines.push(`bad: ${r.bad.join('; ')}`);
    if (r.observations.length)
      lines.push(`observations: ${r.observations.join('; ')}`);
    lines.push(`score: ${r.score}`);
    lines.push('-----------------');
  });

  lines.push('and here are the last 5 month rapports:');
  monthly.slice(0, 5).forEach((r) => {
    lines.push(`${r.startDate} to ${r.endDate}`);
    lines.push(`summary: ${r.summary}`);
    if (r.good.length) lines.push(`good: ${r.good.join('; ')}`);
    if (r.bad.length) lines.push(`bad: ${r.bad.join('; ')}`);
    if (r.observations.length)
      lines.push(`observations: ${r.observations.join('; ')}`);
    lines.push(`score: ${r.score}`);
    lines.push('-----------------');
  });

  lines.push('and here is the year rapport');
  if (yearly.length > 0) {
    const r = yearly[0];
    lines.push(`${r.startDate} to ${r.endDate}`);
    lines.push(`summary: ${r.summary}`);
    if (r.good.length) lines.push(`good: ${r.good.join('; ')}`);
    if (r.bad.length) lines.push(`bad: ${r.bad.join('; ')}`);
    if (r.observations.length)
      lines.push(`observations: ${r.observations.join('; ')}`);
    lines.push(`score: ${r.score}`);
  } else {
    lines.push('No yearly assessment yet.');
  }

  const context = lines.join('\n');

  const setup = DEFAULT_LLM_SETUP;
  const systemPrompt = buildSystemPrompt(toneId);
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
      parsed = {
        Overview: msg,
        'short-term': [],
        'long-term': [],
        feedback: [],
        'score-progress': 0,
        'score-probability': 0,
      };
    }
    const report = {
      overview: parsed.Overview || '',
      shortTerm: Array.isArray(parsed['short-term'])
        ? parsed['short-term']
        : [],
      longTerm: Array.isArray(parsed['long-term'])
        ? parsed['long-term']
        : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    };
    const scoreProgress = Number(parsed['score-progress']) || 0;
    const scoreProbability = Number(parsed['score-probability']) || 0;
    await createHeadingReport(
      userId,
      date,
      report,
      scoreProgress,
      scoreProbability,
      toneId,
    );
    return NextResponse.json({
      report: parsed,
      scoreProgress,
      scoreProbability,
      context,
    });
  } catch (e: any) {
    console.error('heading-report generation failed', e);
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
