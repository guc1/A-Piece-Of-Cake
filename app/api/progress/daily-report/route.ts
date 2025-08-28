import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createDailyReport } from '@/lib/daily-report-store';
import { getPlanStrict } from '@/lib/plans-store';
import { getIngredient } from '@/lib/ingredients-store';
import { getFlavor } from '@/lib/flavors-store';
import { getSubflavor } from '@/lib/subflavors-store';
import { resolvePlanDate, toYMD } from '@/lib/plan-date';
import { DEFAULT_LLM_SETUP } from '@/lib/llm/config';

// Assessment agent prompt distilled from user instructions
const COACH_TONE_DESCRIPTIONS: Record<string, string> = {
  tone_soft: 'Provide a supportive ramp-up for beginners.',
  tone_medium: 'Offer balanced guidance to keep momentum.',
  tone_hard: 'Deliver high accountability without fluff.',
  tone_superhard: 'Adopt an elite performance mode with tight loops.',
};

function buildSystemPrompt(tone: string) {
  const toneDesc =
    COACH_TONE_DESCRIPTIONS[tone] ?? COACH_TONE_DESCRIPTIONS.tone_medium;
  return `You are the Daily Assessment agent for the Piece of Cake framework. Flavors are life domains that, together, create the user's Cake, and ingredients are the habits that add them. The user's Cake—their ethos—guides direction without a fixed destination.

Evaluate the provided day: judge the plan's difficulty, focus, and potential they had on the day, then how execution aligned with it. ${toneDesc} Keep the tone wise and constructive.

Respond ONLY with JSON of the form {"summary":string,"good":string[],"bad":string[],"observations":string[],"score":0-100}.`;
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
  const reviews = body.reviews || {};
  const ethos = body.ethos || body.rational || '';
  const toneId =
    body.toneId || (session?.user as any)?.coachToneId || 'tone_medium';

  const { date: dateObj, tz } = resolvePlanDate('live', session?.user as any, {
    cookies: req.cookies,
    searchParams: Object.fromEntries(req.nextUrl.searchParams),
  });
  const today = toYMD(dateObj, tz);
  const targetDate =
    typeof body.date === 'string' && body.date ? body.date : today;

  const plan = body.plan
    ? {
        blocks: body.plan.blocks ?? [],
        dailyAim: body.plan.dailyAim ?? '',
        dailyIngredientIds: body.plan.dailyIngredientIds ?? [],
      }
    : await getPlanStrict(userId, targetDate);

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
    plan.dailyIngredientIds.map((id: number) => loadIngredient(id)),
  );

  const activities = [] as any[];
  const sorted = [...plan.blocks].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  for (const blk of sorted) {
    const ings = await Promise.all(
      blk.ingredientIds.map((id: number) => loadIngredient(id)),
    );
    const flavors = await Promise.all(
      blk.flavorIds.map((fid: number | string) =>
        getFlavor(String(userId), String(fid), userId),
      ),
    );
    const subflavors = await Promise.all(
      blk.subflavorIds.map((sid: number | string) =>
        getSubflavor(String(userId), String(sid), userId),
      ),
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
    return `ID: 1ngred-card-${ing.id}-${userId}\nTitle: ${ing.title}\nShort description: ${ing.shortDescription}\nUsefulness (scale 1-100): ${ing.usefulness}\n\nWhat it is: ${ing.description}\nWhy used: ${ing.whyUsed}\nWhen used / situations: ${ing.whenUsed}\nTips: ${ing.tips}`;
  }

  const lines: string[] = [];
  lines.push(
    `The Ethos / Life Thesis / Telos/rational that the user is trying to achieve in his life (his cake) is: ${
      ethos || 'not provided'
    } . for today ${targetDate} the users daily aim (id: p1an-day-aim-${userId}) was ${
      plan.dailyAim || 'not filled in'
    }${dailyIngredients.length ? ' with the following ingredients:' : ''}`,
  );
  for (const ing of dailyIngredients.filter(Boolean)) {
    lines.push(`ingredient id: p1an-day-igrd-${ing.id}-${userId}`);
    lines.push(formatIngredient(ing));
  }
  lines.push('-------------------------------');
  lines.push(
    'the activities the user had inputted for today: (here the activities are going to be sorted with the earlies ones starting first)',
  );
  if (activities.length === 0) lines.push('no activities planned');
  for (const act of activities) {
    lines.push(`activity id: p1an-blk-${act.id}-${userId}`);
    lines.push(`Activity: ${act.title}`);
    lines.push(`Description: ${act.description}`);
    lines.push(`Time: ${act.start} till ${act.end}`);
    if (act.ingredients.length) {
      lines.push('ingredients:');
      for (const ing of act.ingredients) {
        lines.push(formatIngredient(ing));
      }
    }
    if (act.flavors.length) {
      lines.push('flavours:');
      for (const fl of act.flavors)
        lines.push(
          `- f7avour${fl.id}-${userId}: ${fl.name}: ${fl.description} (importance ${fl.importance})`,
        );
    }
    if (act.subflavors.length) {
      lines.push('subflavours:');
      for (const sf of act.subflavors)
        lines.push(
          `- s7ubflavourrow${sf.id}-${userId}: ${sf.name}: ${sf.description} (importance ${sf.importance})`,
        );
    }
  }
  lines.push(
    '(this is than done for all activities and every activity gets its own id)',
  );
  lines.push('--------------------------');
  lines.push(
    "in this part the review of the user are provided: start by the review of the daily aim, and the review of the ingredients (if filled in, if not filled in it will say everywhere, user didn't leave feedback)",
  );
  lines.push('review of the daily aim:');
  lines.push(
    `- what went good: ${dailyAimReview.good || 'user did not leave feedback'}`,
  );
  lines.push(
    `- what went bad: ${dailyAimReview.bad || 'user did not leave feedback'}`,
  );
  lines.push('- ingredient feedback:');
  const aimIngReviews = dailyAimReview.ingredients || {};
  if (Object.keys(aimIngReviews).length === 0) {
    lines.push('  user did not leave feedback');
  } else {
    for (const [iid, fb] of Object.entries(aimIngReviews)) {
      const ing = await loadIngredient(Number(iid));
      const name = ing?.title || `ingredient ${iid}`;
      lines.push(
        `  - 1ngred-card-${iid}-${userId} (${name}): ${fb || 'user did not leave feedback'}`,
      );
    }
  }
  lines.push('and here is the review for every activitity the user did:');
  for (const act of activities) {
    const r = activityReviews.get(act.id) || {};
    lines.push(
      `activity p1an-blk-${act.id}-${userId} (${act.start}-${act.end}) ${act.title}`,
    );
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
        lines.push(
          `  - 1ngred-card-${iid}-${userId} (${name}): ${fb || 'user did not leave feedback'}`,
        );
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
      { role: 'system', content: buildSystemPrompt(toneId) },
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
    await createDailyReport(userId, targetDate, content, score);
    console.log('daily report saved', { userId, date: targetDate, score });
    return NextResponse.json({ report: parsed, score, context });
  } catch (e: any) {
    console.error('daily-report generation failed', e);
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
