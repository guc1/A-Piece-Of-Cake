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

export interface TrackingIngredientSummary {
  id: string;
  ingredientId: number;
  title: string;
  icon: string;
  createdAt: string;
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
  doneIngredients: string[];
  plannedIngredients: string[];
}

export interface TrackingDataset {
  timezone: string;
  today: string;
  now: string;
  maxDays: number;
  flavors: TrackingFlavorSummary[];
  subflavors: TrackingSubflavorSummary[];
  ingredients: TrackingIngredientSummary[];
  records: TrackingDailyRecord[];
}
