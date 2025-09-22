export interface TrackingFlavorSummary {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  orderIndex: number;
}

export interface TrackingSubflavorSummary {
  id: string;
  flavorId: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  orderIndex: number;
}

export interface TrackingDailyRecord {
  date: string;
  totalMinutes: number;
  flavorMinutes: Record<string, number>;
  subflavorMinutes: Record<string, number>;
  doneFlavors: string[];
  plannedFlavors: string[];
  doneSubflavors: string[];
  plannedSubflavors: string[];
}

export interface TrackingDataset {
  timezone: string;
  today: string;
  now: string;
  maxDays: number;
  flavors: TrackingFlavorSummary[];
  subflavors: TrackingSubflavorSummary[];
  records: TrackingDailyRecord[];
}
