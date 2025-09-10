export type Visibility = 'private' | 'followers' | 'friends' | 'public';

export interface Todo {
  id: number;
  userId: number;
  title: string;
  description: string;
  priority: number;
  icon: string;
  visibility: Visibility;
  completed: boolean;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoInput {
  title: string;
  description?: string;
  priority: number;
  icon: string;
  visibility?: Visibility;
  completed?: boolean;
  dueAt?: string;
}
