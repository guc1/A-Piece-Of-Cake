import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DEFAULT_LLM_SETUP } from '@/lib/llm/config';
import { getCoachTone } from '@/lib/ai/coach-tone';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { listDailyReports } from '@/lib/daily-report-store';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { listMonthlyReports } from '@/lib/monthly-report-store';
import { listYearlyReports } from '@/lib/yearly-report-store';
import {
  createOverviewReport,
  listOverviewReports,
} from '@/lib/overview-report-store';

function buildSystemPrompt(toneId: string) {
  const tone = getCoachTone(toneId);
  return `You are a helpful assistant in the Piece of Cake framework that will describe and evaluate the direction the person is going in his or her life. Piece of Cake is a framework that paints flavors as goals in different domains of life, achieved using ingredients (habits). These flavors combine into a cake, representing the shape, size, and taste of their life. Every person wants a different cake, but most people want as good a cake as possible. What is more important in the Piece of Cake framework is the direction you are going instead of the position you currently are.\n\nYour goal is to output a structured report. Respond ONLY with JSON of the form {"Overview":string,"short-term":string[],"long-term":string[],"feedback":string[],"score-progress":0-100,"score-probability":0-100}.\n\nI will now explain what each field is and how the output should look:\n- Overview: facts or information you based your knowledge on.\n- short-term: the direction you are heading in the coming months.\n- long-term: where you are heading in the coming years if the current trend continues.\n- feedback: detailed advice on what to change or focus on, relating habits (ingredients) and goals (flavors).\n- score-progress: estimate how far the user is with their goals (0-100).\n- score-probability: likelihood of reaching goals based on current behaviour (0-100).\n\nThe tone of your assessment should be: ${JSON.stringify(tone, null, 2)} Keep the tone wise and constructive.`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const paramUserId = Number(req.nextUrl.searchParams.get('userId'));
  const userId = paramUserId || Number(session?.user?.id);
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const rational = body.rational || '';
  const guilty = body.guilty || '';

  const [userRow] = await db
    .select({ coachTone: users.coachTone })
    .from(users)
    .where(eq(users.id, userId));
  const toneId = body.toneId || userRow?.coachTone || 'tone_medium';

  const today = new Date().toISOString().slice(0, 10);

  const [daily, weekly, monthly, yearly] = await Promise.all([
    listDailyReports(userId),
    listWeeklyReports(userId),
    listMonthlyReports(userId),
    listYearlyReports(userId),
  ]);

  const lines: string[] = [];
  lines.push(
    `this is the rational/goals/life ethos the user wants to reach {rational: ${rational} | guilty pleasure: ${guilty}}`,
  );
  lines.push('here is the context of how the user is performing:');
  lines.push('***last 4 day reports***:');
  const dailyItems = daily.slice(0, 4);
  if (dailyItems.length === 0) {
    lines.push('The user was not using the app at that time.');
  } else {
    for (const rpt of dailyItems) {
      lines.push(`${rpt.date}: summary: ${rpt.summary}`);
      if (rpt.good.length) lines.push(`good: ${rpt.good.join('; ')}`);
      if (rpt.bad.length) lines.push(`bad: ${rpt.bad.join('; ')}`);
      if (rpt.observations.length)
        lines.push(`observations: ${rpt.observations.join('; ')}`);
      lines.push(`score: ${rpt.score}`);
      lines.push('---');
    }
  }

  lines.push('here are the last 2 week reports:');
  const weeklyItems = weekly.slice(0, 2);
  if (weeklyItems.length === 0) {
    lines.push('The user was not using the app at that time.');
  } else {
    for (const rpt of weeklyItems) {
      lines.push(`${rpt.startDate} to ${rpt.endDate}: summary: ${rpt.summary}`);
      if (rpt.good.length) lines.push(`good: ${rpt.good.join('; ')}`);
      if (rpt.bad.length) lines.push(`bad: ${rpt.bad.join('; ')}`);
      if (rpt.observations.length)
        lines.push(`observations: ${rpt.observations.join('; ')}`);
      lines.push(`score: ${rpt.score}`);
      lines.push('---');
    }
  }

  lines.push('and here are the last 2 month rapports:');
  const monthlyItems = monthly.slice(0, 2);
  if (monthlyItems.length === 0) {
    lines.push('The user was not using the app at that time.');
  } else {
    for (const rpt of monthlyItems) {
      lines.push(`${rpt.startDate} to ${rpt.endDate}: summary: ${rpt.summary}`);
      if (rpt.good.length) lines.push(`good: ${rpt.good.join('; ')}`);
      if (rpt.bad.length) lines.push(`bad: ${rpt.bad.join('; ')}`);
      if (rpt.observations.length)
        lines.push(`observations: ${rpt.observations.join('; ')}`);
      lines.push(`score: ${rpt.score}`);
      lines.push('---');
    }
  }

  lines.push('and here is the year rapport');
  const yearlyItem = yearly[0];
  if (!yearlyItem) {
    lines.push('The user was not using the app at that time.');
  } else {
    lines.push(
      `${yearlyItem.startDate} to ${yearlyItem.endDate}: summary: ${yearlyItem.summary}`,
    );
    if (yearlyItem.good.length)
      lines.push(`good: ${yearlyItem.good.join('; ')}`);
    if (yearlyItem.bad.length) lines.push(`bad: ${yearlyItem.bad.join('; ')}`);
    if (yearlyItem.observations.length)
      lines.push(`observations: ${yearlyItem.observations.join('; ')}`);
    lines.push(`score: ${yearlyItem.score}`);
  }

  const context = lines.join('\n');

  const setup = DEFAULT_LLM_SETUP;
  const systemPrompt = buildSystemPrompt(toneId);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing OpenAI API key' },
      { status: 500 },
    );
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
    const scoreProgress = Number(parsed['score-progress']) || 0;
    const scoreProbability = Number(parsed['score-probability']) || 0;
    const content = {
      overview: parsed.Overview || '',
      shortTerm: Array.isArray(parsed['short-term'])
        ? parsed['short-term']
        : [],
      longTerm: Array.isArray(parsed['long-term']) ? parsed['long-term'] : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    };
    await createOverviewReport(
      userId,
      today,
      content,
      scoreProgress,
      scoreProbability,
      toneId,
    );
    return NextResponse.json({
      report: parsed,
      scoreProgress,
      scoreProbability,
      context,
      date: today,
    });
  } catch (e: any) {
    console.error('overview-report generation failed', e);
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

export async function GET(req: NextRequest) {
  const session = await auth();
  const paramUserId = Number(req.nextUrl.searchParams.get('userId'));
  const userId = paramUserId || Number(session?.user?.id);
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const reports = await listOverviewReports(userId);
  const rpt = reports[0];
  if (!rpt) return NextResponse.json({ report: null });
  const report = {
    Overview: rpt.overview,
    'short-term': rpt.shortTerm,
    'long-term': rpt.longTerm,
    feedback: rpt.feedback,
    'score-progress': rpt.scoreProgress,
    'score-probability': rpt.scoreProbability,
    date: rpt.date,
  };
  return NextResponse.json({ report });
}
