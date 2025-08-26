export interface DailyReport {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  content: string; // JSON string of report
  score: number;
  createdAt: string;
}
