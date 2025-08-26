import { test, expect } from '@playwright/test';
import { extractDailyReport } from '../lib/daily-report-parser';

test('extracts valid report', () => {
  const raw =
    '{"summary":"s","good":["g"],"bad":[],"observations":[],"score":42}';
  const parsed = extractDailyReport(raw);
  expect(parsed.score).toBe(42);
  expect(parsed.good).toEqual(['g']);
});

test('rejects duplicated payload', () => {
  const raw =
    '{"summary":"s","good":[],"bad":[],"observations":[],"score":10},83,{"summary":"s","good":[],"bad":[],"observations":[],"score":10},83';
  expect(() => extractDailyReport(raw)).toThrow();
});

test('rejects missing or invalid score', () => {
  const raw = '{"summary":"s","good":[],"bad":[],"observations":[]}';
  expect(() => extractDailyReport(raw)).toThrow();
  const raw2 =
    '{"summary":"s","good":[],"bad":[],"observations":[],"score":"hi"}';
  expect(() => extractDailyReport(raw2)).toThrow();
});
