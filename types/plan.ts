export interface Plan {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface PlanBlock {
  id: string;
  planId: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  title: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type PlanBlockInput = Omit<
  PlanBlock,
  'id' | 'planId' | 'createdAt' | 'updatedAt'
> & {
  id?: string;
};
