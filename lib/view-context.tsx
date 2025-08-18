'use client';
import { createContext, useContext } from 'react';
import type { ViewContext } from './profile';

const Ctx = createContext<ViewContext>({
  ownerId: 0,
  viewerId: null,
  mode: 'owner',
  editable: true,
  viewId: '',
});

export function ViewContextProvider({
  value,
  children,
}: {
  value: ViewContext;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useViewContext() {
  return useContext(Ctx);
}
