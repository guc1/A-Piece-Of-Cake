export interface ReportOverviewReportItem {
  type: 'report';
  key: string;
  slug: string;
  title: string;
  version?: number;
  summary: string;
  good: string[];
  bad: string[];
  observations: string[];
  toneName: string;
  score: number;
  difficultyLabel: string;
  linkHref: string;
}

export interface ReportOverviewMissingItem {
  type: 'missing';
  key: string;
  title: string;
  message: string;
}

export type ReportOverviewItem =
  | ReportOverviewReportItem
  | ReportOverviewMissingItem;

