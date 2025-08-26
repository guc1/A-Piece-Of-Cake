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
const SYSTEM_PROMPT = `You are an assessment agent for the Piece of Cake framework. Choices add positive “flavors” (life domains) through concrete “ingredients” (habits/rules). The Cake represents the user’s ethos—direction without a fixed destination. Review the user’s plan against execution, noting constructive contributions, trade-offs, and imbalances.

Be wise and fair but unafraid to be strict: higher aspirations invite tougher grading. Recognise wins, call out self‑sabotage, and weigh plan difficulty against execution quality.

Respond only with JSON using keys: summary (string), good (string[]), bad (string[]), observations (string[]), score (number 0-100).`;

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

  let today: string;
  if (body.date) {
    today = body.date as string;
  } else {
    const { date: dateObj, tz } = resolvePlanDate(
      'live',
      session?.user as any,
      { cookies: req.cookies, searchParams: Object.fromEntries(req.nextUrl.searchParams) },
    );
    today = toYMD(dateObj, tz);
  }

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
    return `Title: ${ing.title}\nShort description: ${ing.shortDescription}\nUsefulness (scale 1-100): ${ing.usefulness}\n\nWhat it is: ${ing.description}\nWhy used: ${ing.whyUsed}\nWhen used / situations: ${ing.whenUsed}\nTips: ${ing.tips}`;
  }

  const lines: string[] = [];
  lines.push(
    `The Ethos / Life Thesis / Telos/rational that the user is trying to achieve in his life (his cake) is: ${
      ethos || 'not provided'
    } . for today ${today} the users daily aim was ${
      plan.dailyAim || 'not filled in'
    }${
      dailyIngredients.length
        ? ' , the one from life planning take that one including the information of which ingredients the user added for that day so the Title\nShort description\nUsefulness (scale 1-100)\n\nWhat it is\nWhy used\nWhen used / situations\nTips.  for that ingredient.'
        : ''
    }`,
  );
  for (const ing of dailyIngredients.filter(Boolean)) {
    lines.push(formatIngredient(ing));
  }
  lines.push('-------------------------------');
  lines.push(
    'the activities the user had inputted for today: (here the activities are going to be sorted with the earlies ones starting first)',
  );
  for (const act of activities) {
    lines.push('{');
    lines.push(`activity id: ${act.id}`);
    lines.push(`Activity: ${act.title}`);
    lines.push(`Description: ${act.description}`);
    lines.push(`Time start till end: ${act.start} till ${act.end}`);
    if (act.ingredients.length) {
      lines.push('ingredients:');
      for (const ing of act.ingredients) lines.push(formatIngredient(ing));
    }
    if (act.flavors.length) {
      lines.push('flavours:');
      for (const fl of act.flavors)
        lines.push(`- ${fl.name}: ${fl.description} (importance ${fl.importance})`);
    }
    if (act.subflavors.length) {
      lines.push('subflavours:');
      for (const sf of act.subflavors)
        lines.push(`- ${sf.name}: ${sf.description} (importance ${sf.importance})`);
    }
    lines.push('}');
  }
  lines.push(
    '(this is than done for all activities and every activity gets its own id).',
  );
  lines.push('--------------------------');
  lines.push(
    "in this part the review of the user are provided: {start by the review of the daily aim, and the review of the ingredients (if filled in, if not filled in it will say everywhere, user didn't leave feedback)}",
  );
  lines.push('review of the daily aim:');
  lines.push(`- what went good: ${dailyAimReview.good || 'user did not leave feedback'}`);
  lines.push(`- what went bad: ${dailyAimReview.bad || 'user did not leave feedback'}`);
  lines.push('- review of the ingredient:');
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
  lines.push(
    'and here is the review for every activitity the user did: {activity id and time and title, than include the what went good and what went bad and the review of the ingredient (if given)}',
  );
  for (const act of activities) {
    const r = activityReviews.get(act.id) || {};
    lines.push('{');
    lines.push(`activity id: ${act.id} time: ${act.start}-${act.end} title: ${act.title}`);
    lines.push(`- what went good: ${r.good || 'user did not leave feedback'}`);
    lines.push(`- what went bad: ${r.bad || 'user did not leave feedback'}`);
    lines.push('- review of the ingredient:');
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
    lines.push('}');
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
