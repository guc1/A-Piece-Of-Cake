export function getDifficultyLabel(score: number): string {
  if (score >= 70) return 'Hard';
  if (score >= 40) return 'Medium';
  return 'Easy';
}
