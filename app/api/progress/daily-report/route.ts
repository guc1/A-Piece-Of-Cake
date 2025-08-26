import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createDailyReport } from '@/lib/daily-report-store';
import { getPlanStrict } from '@/lib/plans-store';
import { getIngredient } from '@/lib/ingredients-store';
import { getFlavor } from '@/lib/flavors-store';
import { getSubflavor } from '@/lib/subflavors-store';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { DEFAULT_LLM_SETUP } from '@/lib/llm/config';

// Assessment agent prompt summarised from user instructions
const SYSTEM_PROMPT = `You are a helpful assistant in the Piece of Cake framework: actions add \"flavors\" (life domains) through \"ingredients\" (habits/rules). The Cake is the user's guiding ethos, offering direction without a fixed destination. Compare the user's plan with their execution, highlighting positive contributions, trade-offs, and imbalance.

Be wise, strict yet fair. Ambitious goals warrant tougher grading; acknowledge wins, call out self-sabotage, and consider planning difficulty versus execution quality.

Respond ONLY with JSON containing: summary (string), good (string[]), bad (string[]), observations (string[]), score (number 0-100).`;

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
  const ethos = body.ethos || body.rational || '';

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

  // --- reviews ---
  const dailyAimReview = reviews['day'] || {};

  const activityReviews = new Map<string, any>();
  for (const act of activities) {
    const r = reviews[act.id] || {};
    activityReviews.set(act.id, r);
  }

  // --- build context string ---
  function formatIngredient(ing: any): string {
    return `- ${ing.title}\n  Short description: ${ing.shortDescription}\n  Usefulness (1-100): ${ing.usefulness}\n  What it is: ${ing.description}\n  Why used: ${ing.whyUsed}\n  When used / situations: ${ing.whenUsed}\n  Tips: ${ing.tips}`;
  }

  const lines: string[] = [];
  lines.push(`The Ethos / Life Thesis / Telos/rational that the user is trying to achieve in his life (his cake) is: ${ethos || 'not provided'} . for today ${today} the users daily aim was ${plan.dailyAim || 'not filled in'}${dailyIngredients.length ? ' with the following ingredients:' : ''}`);
  for (const ing of dailyIngredients.filter(Boolean)) {
    lines.push(formatIngredient(ing));
  }
  lines.push('-------------------------------');
  lines.push('the activities the user had inputted for today:');
  if (activities.length === 0) lines.push('no activities planned.');
  for (const act of activities) {
    lines.push(`activity id ${act.id}`);
    lines.push(`Activity: ${act.title}`);
    lines.push(`Description: ${act.description}`);
    lines.push(`Time: ${act.start} till ${act.end}`);
    if (act.ingredients.length) {
      lines.push('Ingredients:');
      for (const ing of act.ingredients) lines.push(formatIngredient(ing));
    }
    if (act.flavors.length) {
      lines.push('Flavors:');
      for (const fl of act.flavors)
        lines.push(`- ${fl.name}: ${fl.description} (importance ${fl.importance})`);
    }
    if (act.subflavors.length) {
      lines.push('Subflavors:');
      for (const sf of act.subflavors)
        lines.push(`- ${sf.name}: ${sf.description} (importance ${sf.importance})`);
    }
  }
  lines.push('--------------------------');
  lines.push('in this part the review of the user are provided:');
  lines.push('review of the daily aim:');
  lines.push(`- what went good: ${dailyAimReview.good || 'user did not leave feedback'}`);
  lines.push(`- what went bad: ${dailyAimReview.bad || 'user did not leave feedback'}`);
  lines.push('- ingredient feedback:');
  const aimIngReviews = dailyAimReview.ingredients || {};
  if (Object.keys(aimIngReviews).length === 0) {
    lines.push('  user did not leave feedback');
  } else {
    for (const [iid, fb] of Object.entries(aimIngReviews)) {
      const ing = await loadIngredient(Number(iid));
      const name = ing?.title || `ingredient ${iid}`;
      lines.push(`  - ${name}: ${fb || 'user did not leave feedback'}`);
    }
  }
  lines.push('activity reviews:');
  for (const act of activities) {
    const r = activityReviews.get(act.id) || {};
    lines.push(`activity ${act.id} (${act.start}-${act.end}) ${act.title}`);
    lines.push(`- what went good: ${r.good || 'user did not leave feedback'}`);
    lines.push(`- what went bad: ${r.bad || 'user did not leave feedback'}`);
    lines.push('- ingredient feedback:');
    const ingReviews = r.ingredients || {};
    if (Object.keys(ingReviews).length === 0) {
      lines.push('  user did not leave feedback');
    } else {
      for (const [iid, fb] of Object.entries(ingReviews)) {
        const ing = await loadIngredient(Number(iid));
        const name = ing?.title || `ingredient ${iid}`;
        lines.push(`  - ${name}: ${fb || 'user did not leave feedback'}`);
      }
    }
  }
  lines.push('------------------------------');
  lines.push(
    'youre goal is to now write the report in the structured output and take everything into consideration.',
  );

  const context = lines.join('\n');

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
    await createDailyReport(userId, today, JSON.stringify(parsed), score);
    return NextResponse.json({ report: parsed, score, context });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
