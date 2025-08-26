import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createDailyReport } from '@/lib/daily-report-store';
import { getPlanStrict } from '@/lib/plans-store';
import { getIngredient } from '@/lib/ingredients-store';
import { getFlavor } from '@/lib/flavors-store';
import { getSubflavor } from '@/lib/subflavors-store';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { DEFAULT_LLM_SETUP } from '@/lib/llm/config';

const SYSTEM_PROMPT = `You are a helpful assistant in the Piece of Cake framework. Every action adds constructive \"flavors\" (life domains) by way of \"ingredients\" (habits, rules, rituals) and is guided by the user's Cake—their ethos or life thesis.

Given the user's plan, daily aim, and execution feedback, judge the day with wisdom and fairness. Weigh how challenging the plan was and how well it was executed. Reward meaningful progress, note positive contributions, and call out imbalance or self‑sabotage. Higher ambitions deserve tougher grading.

Return JSON with keys: summary (string), good (string[]), bad (string[]), observations (string[]), score (0-100).`;

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
  const rational = body.rational || '';

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

  // build context string for LLM
  function formatIngredient(ing: any) {
    return `Title: ${ing.title}\nShort description: ${ing.shortDescription || ''}\nUsefulness (scale 1-100): ${ing.usefulness}\nWhat it is: ${ing.description || ''}\nWhy used: ${ing.whyUsed || ''}\nWhen used / situations: ${ing.whenUsed || ''}\nTips: ${ing.tips || ''}`;
  }

  function formatFlavor(f: any) {
    return `Name: ${f.title}\nDescription: ${f.description || ''}\nImportance: ${f.importance}`;
  }

  const dailyAimIngText = dailyIngredients
    .filter(Boolean)
    .map((ing) => `-\n${formatIngredient(ing)}`)
    .join('\n');

  const activitiesText = activities
    .map((act) => {
      const ingText = act.ingredients
        .map((ing: any) => `-\n${formatIngredient(ing)}`)
        .join('\n');
      const flavorText = act.flavors
        .map((f: any) => `-\n${formatFlavor(f)}`)
        .join('\n');
      const subflavorText = act.subflavors
        .map((s: any) => `-\n${formatFlavor(s)}`)
        .join('\n');
      return `Activity ${act.id}: ${act.title}\nDescription: ${act.description || ''}\nTime: ${act.start}-${act.end}\nIngredients:\n${ingText || 'none'}\nFlavors:\n${flavorText || 'none'}\nSubflavors:\n${subflavorText || 'none'}`;
    })
    .join('\n');

  async function formatReviewIngredients(obj: Record<string, string>) {
    const entries = await Promise.all(
      Object.entries(obj).map(async ([id, text]) => {
        const ing = await loadIngredient(Number(id));
        const title = ing ? ing.title : `Ingredient ${id}`;
        return `- ${title}: ${text}`;
      }),
    );
    return entries.length ? entries.join('\n') : 'user did not leave feedback';
  }

  const dailyAimReviewIngredientsText = await formatReviewIngredients(
    dailyAimReview.ingredients,
  );

  const activityReviewsText = await Promise.all(
    activityReviews.map(async (ar) => {
      const ingText = await formatReviewIngredients(ar.ingredients);
      return `Activity id ${ar.id} (${ar.time}) ${ar.title}\nWhat went good: ${ar.good}\nWhat went bad: ${ar.bad}\nIngredient reviews:\n${ingText}`;
    }),
  );

  const parts: string[] = [];
  parts.push(
    `The Ethos / Life Thesis / Telos/rational that the user is trying to achieve in his life (his cake) is: ${
      rational || 'not provided'
    } . for today ${today} the users daily aim was ${
      plan.dailyAim || 'not filled in'
    }`,
  );
  if (dailyAimIngText)
    parts.push(`and the ingredients for that day were:\n${dailyAimIngText}`);
  parts.push('-------------------------------');
  parts.push(
    activities.length
      ? `the activities the user had inputted for today:\n${activitiesText}`
      : 'the activities the user had inputted for today: none',
  );
  parts.push('--------------------------');
  parts.push('in this part the review of the user are provided:');
  parts.push(
    `Daily aim review:\nWhat went good: ${dailyAimReview.good}\nWhat went bad: ${dailyAimReview.bad}\nIngredient reviews:\n${dailyAimReviewIngredientsText}`,
  );
  parts.push('and here is the review for every activity the user did:');
  parts.push(activityReviewsText.join('\n'));
  parts.push('------------------------------');
  parts.push(
    'youre goal is to now write the report in the structured output and take everything into consideration.',
  );
  const contextStr = parts.join('\n');

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
      { role: 'user', content: contextStr },
    ],
    response_format: { type: 'json_object' },
  } as any;

  try {
    console.log('LLM request:', contextStr);
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
    console.log('LLM response:', parsed);
    await createDailyReport(userId, today, JSON.stringify(parsed), score);
    return NextResponse.json({ report: parsed, score, context: contextStr });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
