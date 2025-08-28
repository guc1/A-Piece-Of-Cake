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
  createdAt: string;
}
