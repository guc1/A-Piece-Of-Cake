export interface ReportContent {
  summary: string;
  good: string[];
  bad: string[];
  observations: string[];
  score: number;
}

export interface DailyReport {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  content: ReportContent; // raw JSON of report
  score: number;
  createdAt: string;
}
