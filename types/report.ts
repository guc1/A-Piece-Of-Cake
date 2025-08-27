export interface ReportLine {
  id: string;
  text: string;
}

export interface ReportScore {
  id: string;
  value: number;
}

export interface ReportContent {
  summary: ReportLine;
  good: ReportLine[];
  bad: ReportLine[];
  observations: ReportLine[];
  score: ReportScore;
}

export interface DailyReport {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  version: number;
  content: ReportContent; // raw JSON of report
  score: number;
  createdAt: string;
}
