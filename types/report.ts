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
