import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createDailyReport } from '@/lib/daily-report-store';
import { getPlanStrict } from '@/lib/plans-store';
import { getIngredient } from '@/lib/ingredients-store';
import { getFlavor } from '@/lib/flavors-store';
import { getSubflavor } from '@/lib/subflavors-store';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { DEFAULT_LLM_SETUP } from '@/lib/llm/config';

const SYSTEM_PROMPT = `You are a strict yet fair assessment agent in the Piece of Cake framework. Actions add \"flavors\" (life domains) through \"ingredients\" (habits/rules) guided by the user's ethos. Using the provided plan, aim, and execution feedback, evaluate the day.

Output JSON only with keys: summary (string), good (string array), bad (string array), observations (string array), score (number 0-100). Consider planning difficulty and execution quality; be harder on ambitious goals, acknowledge successes, and call out self-sabotage.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const reviews = body.reviews || {};
  const ethos = body.ethos || '';

  const { date: dateObj, tz } = resolvePlanDate(
    'live',
    session?.user as any,
    { cookies: req.cookies, searchParams: Object.fromEntries(req.nextUrl.searchParams) },
  );
  const today = toYMD(dateObj, tz);

  const plan = await getPlanStrict(userId, today);

  // helper to fetch ingredient details once
  const ingredientCache = new Map<number, any>();
  async function loadIngredient(id: number) {
    if (!ingredientCache.has(id)) {
      const ing = await getIngredient(String(userId), id, userId);
      if (ing) ingredientCache.set(id, ing);
    }
    return ingredientCache.get(id);
  }

  const dailyIngredients = await Promise.all(
    plan.dailyIngredientIds.map((id) => loadIngredient(id)),
  );

  const activities = [] as any[];
  const sorted = [...plan.blocks].sort((a, b) => a.start.localeCompare(b.start));
  for (const blk of sorted) {
    const ings = await Promise.all(blk.ingredientIds.map((id) => loadIngredient(id)));
    const flavors = await Promise.all(
      blk.flavorIds.map((fid) => getFlavor(String(userId), fid, userId)),
    );
    const subflavors = await Promise.all(
      blk.subflavorIds.map((sid) => getSubflavor(String(userId), sid, userId)),
    );
    activities.push({
      id: blk.id,
      title: blk.title,
      description: blk.description,
      start: blk.start,
      end: blk.end,
      ingredients: ings.filter(Boolean),
      flavors: flavors.filter(Boolean),
      subflavors: subflavors.filter(Boolean),
    });
  }

  const dailyAimReview = reviews['day']
    ? {
        good: reviews['day'].good || '',
        bad: reviews['day'].bad || '',
        ingredients: reviews['day'].ingredients || {},
      }
    : { good: 'user did not leave feedback', bad: 'user did not leave feedback', ingredients: {} };

  const activityReviews = activities.map((act) => {
    const r = reviews[act.id];
    if (!r) {
      return {
        id: act.id,
        time: `${act.start}-${act.end}`,
        title: act.title,
        good: 'user did not leave feedback',
        bad: 'user did not leave feedback',
        ingredients: {},
      };
    }
    return {
      id: act.id,
      time: `${act.start}-${act.end}`,
      title: act.title,
      good: r.good || 'user did not leave feedback',
      bad: r.bad || 'user did not leave feedback',
      ingredients: r.ingredients || {},
    };
  });

  const context = {
    ethos,
    date: today,
    dailyAim: {
      text: plan.dailyAim,
      ingredients: dailyIngredients.filter(Boolean),
    },
    activities,
    reviews: {
      dailyAim: dailyAimReview,
      activities: activityReviews,
    },
  };

  const setup = DEFAULT_LLM_SETUP;
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
    await createDailyReport(userId, today, JSON.stringify(parsed), score);
    return NextResponse.json({ report: parsed, score });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
