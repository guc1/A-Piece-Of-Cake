export type Visibility = 'private' | 'friends' | 'followers' | 'public';

export interface Flavor {
  id: string;
  userId: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  importance: number;
  targetMix: number;
  visibility: Visibility;
  orderIndex: number;
  createdAt: string; // ISO string for simplicity
  updatedAt: string;
}

export type FlavorInput = Omit<Flavor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
