export interface DailyReport {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  content: Record<string, unknown>; // raw LLM output JSON
  score: number;
  createdAt: string;
}
