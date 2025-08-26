import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createDailyReport } from '@/lib/daily-report-store';
import { getPlanStrict } from '@/lib/plans-store';
import { DEFAULT_LLM_SETUP } from '@/lib/llm/config';
import { getIngredient } from '@/lib/ingredients-store';
import { getFlavor } from '@/lib/flavors-store';

const SYSTEM_PROMPT = `You are a helpful assessment agent in the Piece of Cake framework. Actions add constructive "flavors" (life domains) through "ingredients" (rules, rituals, habits). The user's Cake—their ethos or life thesis—guides direction without fixing a destination.
Compare the day's plan and daily aim against execution feedback. Be fair yet candid: praise wins, call out self-sabotage, and scale strictness with the user's ambition and the day's difficulty.
Return a JSON object with keys: summary, good (array), bad (array), observations (array), score (0-100).`;

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let bodyJson: any = {};
  try {
    bodyJson = await req.json();
  } catch {
    // ignore
  }
  const targetDate = (bodyJson.date as string) || new Date().toISOString().slice(0, 10);
  const reviews = (bodyJson.reviews as any) || {};
  const rational = (bodyJson.rational as string) || '';

  const plan = await getPlanStrict(userId, targetDate);

  const ingredientIds = new Set<number>();
  for (const id of plan.dailyIngredientIds) ingredientIds.add(id);
  for (const blk of plan.blocks) {
    for (const id of blk.ingredientIds || []) ingredientIds.add(id);
  }
  const ingredientMap: Record<number, any> = {};
  for (const id of ingredientIds) {
    const ing = await getIngredient(String(userId), id);
    if (ing) ingredientMap[id] = ing;
  }
  const flavorIds = new Set<string>();
  for (const blk of plan.blocks) {
    for (const fid of blk.flavorIds || []) flavorIds.add(fid);
  }
  const flavorMap: Record<string, any> = {};
  for (const fid of flavorIds) {
    const fl = await getFlavor(String(userId), fid);
    if (fl) flavorMap[fid] = fl;
  }

  function formatIngredient(i: any) {
    return `Title: ${i.title}\nShort description: ${i.shortDescription}\nUsefulness: ${i.usefulness}\nWhat it is: ${i.description}\nWhy used: ${i.whyUsed}\nWhen used / situations: ${i.whenUsed}\nTips: ${i.tips}`;
  }

  const dailyAimIng = plan.dailyIngredientIds
    .map((id) => ingredientMap[id])
    .filter(Boolean)
    .map((i) => formatIngredient(i))
    .join('\n');

  let context = `The Ethos / Life Thesis / Telos/rational that the user is trying to achieve in his life (his cake) is: ${rational || 'not provided'}. for today ${targetDate} the users daily aim was ${plan.dailyAim || 'not filled in'}`;
  if (dailyAimIng) context += `\nIngredients:\n${dailyAimIng}`;
  context += `\n-------------------------------\n`;
  context += `the activities the user had inputted for today:\n`;
  const blocks = [...plan.blocks].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
  for (const blk of blocks) {
    const ingDetails = (blk.ingredientIds || [])
      .map((id) => ingredientMap[id])
      .filter(Boolean)
      .map((i) => formatIngredient(i))
      .join('\n');
    const flavorDetails = (blk.flavorIds || [])
      .map((id) => flavorMap[id])
      .filter(Boolean)
      .map((f) => `${f.name}: ${f.description}`)
      .join('\n');
    context += `Activity ${blk.id}\nTitle: ${blk.title}\nDescription: ${blk.description}\nTime: ${blk.start} to ${blk.end}\nIngredients:\n${ingDetails || 'none'}\nFlavors:\n${flavorDetails || 'none'}\n`;
  }
  context += `--------------------------\n`;
  const dayReview = reviews['day'] || {};
  context += `in this part the review of the user are provided:\n`;
  context += `Daily aim review:\n  what went good: ${dayReview.good || 'user did not leave feedback'}\n  what went bad: ${dayReview.bad || 'user did not leave feedback'}\n  ingredient reviews:\n`;
  for (const id of plan.dailyIngredientIds) {
    const ing = ingredientMap[id];
    if (ing) {
      context += `   ${ing.title}: ${dayReview.ingredients?.[id] || 'user did not leave feedback'}\n`;
    }
  }
  context += `Activity reviews:\n`;
  for (const blk of blocks) {
    const r = reviews[blk.id] || {};
    context += `  Activity ${blk.id} ${blk.title} (${blk.start} to ${blk.end})\n    what went good: ${r.good || 'user did not leave feedback'}\n    what went bad: ${r.bad || 'user did not leave feedback'}\n`;
    for (const id of blk.ingredientIds || []) {
      const ing = ingredientMap[id];
      if (ing) {
        context += `    ingredient ${ing.title}: ${r.ingredients?.[id] || 'user did not leave feedback'}\n`;
      }
    }
  }
  context += `------------------------------`;

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
    await createDailyReport(userId, targetDate, JSON.stringify(parsed), score);
    return NextResponse.json({ report: parsed, score });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'LLM request failed' },
      { status: 500 },
    );
  }
}
