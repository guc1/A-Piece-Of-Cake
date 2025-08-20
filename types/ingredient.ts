export type Visibility = 'private' | 'followers' | 'friends' | 'public';

export interface Ingredient {
  id: number;
  userId: number;
  title: string;
  shortDescription: string;
  description: string;
  whyUsed: string;
  whenUsed: string;
  tips: string;
  usefulness: number;
  imageUrl: string | null;
  icon: string;
  tags: string[] | null;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export type IngredientInput = Omit<
  Ingredient,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;
