import { auth } from '@/lib/auth';
import { createContext, useContext } from 'react';

export interface ViewContext {
  ownerId: number;
  viewerId: number | null;
  mode: 'owner' | 'viewer';
  editable: boolean;
}

export const ViewContext = createContext<ViewContext | null>(null);
export const ViewContextProvider = ViewContext.Provider;

export function useViewContext() {
  const ctx = useContext(ViewContext);
  if (!ctx) {
    throw new Error('ViewContext missing');
  }
  return ctx;
}

export function buildViewContext(ownerId: number, viewerId: number | null): ViewContext {
  const mode = viewerId === ownerId ? 'owner' : 'viewer';
  return { ownerId, viewerId, mode, editable: mode === 'owner' };
}

export async function getViewContext(ownerId: number): Promise<ViewContext> {
  const session = await auth();
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  return buildViewContext(ownerId, viewerId);
}

export async function assertOwner(ownerId: number) {
  const session = await auth();
  const me = session?.user?.id ? Number(session.user.id) : null;
  if (me !== ownerId) {
    throw new Error('Read-only: you cannot edit another user\'s account.');
  }
}
