export type Visibility = 'private' | 'friends' | 'followers' | 'public';

export interface Subflavor {
  id: string;
  userId: string;
  flavorId: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  importance: number;
  targetMix: number;
  visibility: Visibility;
  orderIndex: number;
  createdAt: string; // ISO string
  updatedAt: string;
}

export type SubflavorInput = Omit<
  Subflavor,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;
