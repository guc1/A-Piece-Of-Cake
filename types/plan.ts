export interface Plan {
  id: string;
  userId: string;
  date: string; // ISO date YYYY-MM-DD
  blocks: PlanBlock[];
  dailyAim: string;
  dailyIngredientIds: number[];
}

export interface PlanBlock {
  id: string;
  planId: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  title: string;
  description: string;
  color: string;
  ingredientIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanBlockInput {
  id?: string;
  start: string;
  end: string;
  title: string;
  description: string;
  color: string;
  ingredientIds: number[];
}
