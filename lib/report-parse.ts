export interface DailyReportPayload {
  summary: string;
  good: string[];
  bad: string[];
  observations: string[];
  score: number;
}

export function parseDailyReport(raw: string): DailyReportPayload {
  const matches = raw.match(/\{[\s\S]*\}/g);
  if (!matches || matches.length !== 1) {
    throw new Error('invalid payload');
  }
  let obj: any;
  try {
    obj = JSON.parse(matches[0]);
  } catch {
    throw new Error('invalid json');
  }
  if (typeof obj.summary !== 'string') {
    throw new Error('invalid summary');
  }
  const arrKeys = ['good', 'bad', 'observations'] as const;
  for (const key of arrKeys) {
    if (!Array.isArray(obj[key]) || !obj[key].every((v: any) => typeof v === 'string')) {
      throw new Error(`invalid ${key}`);
    }
  }
  if (
    typeof obj.score !== 'number' ||
    !Number.isInteger(obj.score) ||
    obj.score < 0 ||
    obj.score > 100
  ) {
    throw new Error('invalid score');
  }
  return {
    summary: obj.summary,
    good: obj.good,
    bad: obj.bad,
    observations: obj.observations,
    score: obj.score,
  };
}
