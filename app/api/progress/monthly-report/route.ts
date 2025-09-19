import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createMonthlyReport } from '@/lib/monthly-report-store';
import { listWeeklyReports } from '@/lib/weekly-report-store';
import { listDailyReports } from '@/lib/daily-report-store';
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
  return `You are the Monthly Assessment agent for the Piece of Cake framework, you will receive context from the entire month either in daily assessment or in weekly assessment rapports of how the user performed that that week or day in the month, your goal is to evaluate the week and output an assessment based on it. Flavors are life domains and ingredients are the habits that add them; when combined, the flavors form the user's Cake—their ethos—which guides direction without a fixed destination.Evaluate the provided day: judge the plan's difficulty, focus, and potential they had on the day, then how execution aligned with it. Be firm yet fair—higher ambitions merit tougher grading, acknowledge wins, and call out self-sabotage. The tone of your assessment should be: ${toneDescription} Keep the tone wise and constructive. Weekly rapports summarize seven days and should be weighed seven times as heavily as individual daily rapports. Respond ONLY with JSON of the form {"summary":string,"good":string[],"bad":string[],"observations":string[],"score":0-100}.`;
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
  const start = body.startDate || body.start;
  const end = body.endDate || body.end;
  const ethos = body.ethos || '';
  if (!start)
    return NextResponse.json({ error: 'Missing date range' }, { status: 400 });

  const [userRow, weekly, daily] = await Promise.all([
    db
      .select({
        coachTone: users.coachTone,
        coachToneCustom: users.coachToneCustom,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId)),
    listWeeklyReports(userId),
    listDailyReports(userId),
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

  const monthStart = new Date(start);
  const monthEnd = end ? new Date(end) : new Date(monthStart);
  if (!end) {
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    monthEnd.setUTCDate(0);
  }
  const startStr = toYMD(monthStart);
  const endStr = toYMD(monthEnd);

  const weeklyMap = new Map(weekly.map((w) => [w.startDate, w]));
  const dailyMap = new Map(daily.map((d) => [d.date, d]));

  const firstMonday = new Date(monthStart);
  while (firstMonday.getUTCDay() !== 1) {
    firstMonday.setUTCDate(firstMonday.getUTCDate() + 1);
  }
  const lastSunday = new Date(monthEnd);
  while (lastSunday.getUTCDay() !== 0) {
    lastSunday.setUTCDate(lastSunday.getUTCDate() - 1);
  }

  const lines: string[] = [];
  lines.push(`the life ethos/goal of the person is: ${ethos}`);
  lines.push("This is the context one which you have to base you're assessment:");

  function addDaily(ymd: string) {
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
      lines.push('No Assessment');
      if (userCreated && ymd < userCreated) {
        lines.push('The user did not have an account on this day yet.');
      } else {
        lines.push('This day the user did not generate a daily assessment.');
      }
    }
    lines.push('-----------------');
  }

  function addWeekly(startW: string, endW: string) {
    const rpt = weeklyMap.get(startW);
    lines.push(`${startW} - ${endW}`);
    if (rpt) {
      lines.push(`summary: ${rpt.summary}`);
      if (rpt.good.length) lines.push(`good: ${rpt.good.join('; ')}`);
      if (rpt.bad.length) lines.push(`bad: ${rpt.bad.join('; ')}`);
      if (rpt.observations.length)
        lines.push(`observations: ${rpt.observations.join('; ')}`);
      lines.push(`score: ${rpt.score}`);
    } else {
      lines.push('No Assessment');
      if (userCreated && endW < userCreated) {
        lines.push('The user did not have an account on this week yet.');
      } else {
        lines.push('This week the user did not generate a weekly assessment.');
      }
    }
    lines.push('-----------------');
  }

  let d = new Date(monthStart);
  while (d < firstMonday && d <= monthEnd) {
    addDaily(toYMD(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }

  for (
    let ws = new Date(firstMonday);
    ws <= lastSunday;
    ws.setUTCDate(ws.getUTCDate() + 7)
  ) {
    const we = new Date(ws);
    we.setUTCDate(ws.getUTCDate() + 6);
    if (we > monthEnd) break;
    addWeekly(toYMD(ws), toYMD(we));
  }

  d = new Date(lastSunday);
  d.setUTCDate(d.getUTCDate() + 1);
  while (d <= monthEnd) {
    addDaily(toYMD(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }

  const context = lines.join('\n');

  const setup = DEFAULT_LLM_SETUP;
  const systemPrompt = buildSystemPrompt(promptToneId, toneCustom);
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
    await createMonthlyReport(
      userId,
      startStr,
      endStr,
      content,
      score,
      toneId,
      toneCustom,
    );
    console.log('monthly report saved', {
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
    console.error('monthly-report generation failed', e);
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
