export interface DailyReportContent {
  summary: string;
  good: string[];
  bad: string[];
  observations: string[];
  score: number;
}

function ensureStringArray(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s) => typeof s === 'string');
}

export function extractDailyReport(raw: string): DailyReportContent {
  if (typeof raw !== 'string') throw new Error('invalid input');
  const trimmed = raw.trim();
  // find first JSON object
  let start = trimmed.indexOf('{');
  if (start === -1) throw new Error('no json found');
  let depth = 0;
  let end = -1;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) throw new Error('no json found');
  const jsonText = trimmed.slice(start, end);
  const extraBefore = trimmed.slice(0, start).trim();
  const extraAfter = trimmed.slice(end).trim();
  if (extraBefore || extraAfter) throw new Error('extra data present');
  let obj: any;
  try {
    obj = JSON.parse(jsonText);
  } catch {
    throw new Error('invalid json');
  }
  const content: DailyReportContent = {
    summary: typeof obj.summary === 'string' ? obj.summary : '',
    good: ensureStringArray(obj.good),
    bad: ensureStringArray(obj.bad),
    observations: ensureStringArray(obj.observations),
    score: Number.isInteger(obj.score) ? obj.score : NaN,
  };
  if (
    !content.summary ||
    !Number.isInteger(content.score) ||
    content.score < 0 ||
    content.score > 100
  ) {
    throw new Error('invalid shape');
  }
  return content;
}
