export interface ReportContent {
  summary: string;
  good: string[];
  bad: string[];
  observations: string[];
}

export interface DailyReport {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  version: number;
  summary: string;
  good: string[];
  bad: string[];
  observations: string[];
  score: number;
  coachTone: string;
  coachToneCustom: string;
  createdAt: string;
}

export interface WeeklyReport {
  id: number;
  userId: number;
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Sunday)
  version: number;
  summary: string;
  good: string[];
  bad: string[];
  observations: string[];
  score: number;
  coachTone: string;
  coachToneCustom: string;
  createdAt: string;
}

export interface MonthlyReport {
  id: number;
  userId: number;
  startDate: string; // YYYY-MM-DD (first day)
  endDate: string; // YYYY-MM-DD (last day)
  version: number;
  summary: string;
  good: string[];
  bad: string[];
  observations: string[];
  score: number;
  coachTone: string;
  coachToneCustom: string;
  createdAt: string;
}

export interface YearlyReport {
  id: number;
  userId: number;
  startDate: string; // YYYY-01-01
  endDate: string; // YYYY-12-31
  version: number;
  summary: string;
  good: string[];
  bad: string[];
  observations: string[];
  score: number;
  coachTone: string;
  coachToneCustom: string;
  createdAt: string;
}

export interface HeadingReport {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  version: number;
  overview: string;
  shortTerm: string[];
  longTerm: string[];
  feedback: string[];
  scoreProgress: number;
  scoreProbability: number;
  coachTone: string;
  coachToneCustom: string;
  createdAt: string;
}
