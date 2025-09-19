'use client';

import {
  createContext,
  useContext,
  type PropsWithChildren,
} from 'react';

export interface HighlightCreationInput {
  targetSlug: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
  snippet: string;
}

export interface HighlightRemovalInput {
  highlightId: number;
  targetSlug: string;
  blockId: string;
}

export interface HighlightingContextValue {
  highlightEnabled: boolean;
  eraseEnabled: boolean;
  selectedColor: string;
  editable: boolean;
  isSaving: boolean;
  createHighlight: (input: HighlightCreationInput) => Promise<void>;
  removeHighlight: (input: HighlightRemovalInput) => Promise<void>;
}

const HighlightingContext = createContext<HighlightingContextValue | null>(
  null,
);

export function HighlightingProvider({
  value,
  children,
}: PropsWithChildren<{ value: HighlightingContextValue }>) {
  return (
    <HighlightingContext.Provider value={value}>
      {children}
    </HighlightingContext.Provider>
  );
}

export function useHighlightingContext(): HighlightingContextValue {
  const ctx = useContext(HighlightingContext);
  if (!ctx) {
    throw new Error('HighlightingContext is not available');
  }
  return ctx;
}
