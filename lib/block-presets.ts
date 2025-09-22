export interface BlockPresetCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface BlockPreset {
  id: string;
  name: string;
  title: string;
  description: string;
  color: string;
  colorPreset?: string;
  ingredientIds: number[];
  flavorIds: string[];
  subflavorIds: string[];
  duration: number;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

interface BlockPresetState {
  categories: BlockPresetCategory[];
  presets: BlockPreset[];
}

const DEFAULT_STATE: BlockPresetState = { categories: [], presets: [] };

function generateId() {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      // @ts-ignore randomUUID existence checked above
      return crypto.randomUUID() as string;
    }
  } catch {
    // ignore and fall back
  }
  return Math.random().toString(36).slice(2, 11);
}

export function blockPresetStorageKey(userId: string) {
  return `block-presets-${userId}`;
}

function sanitizeCategory(raw: any): BlockPresetCategory | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : generateId();
  const createdAt =
    typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();
  return { id, name, createdAt };
}

function sanitizePreset(raw: any): BlockPreset | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const title = typeof raw.title === 'string' ? raw.title : '';
  const description =
    typeof raw.description === 'string' ? raw.description : '';
  const color = typeof raw.color === 'string' && raw.color ? raw.color : '#94A3B8';
  const colorPreset = typeof raw.colorPreset === 'string' ? raw.colorPreset : '';
  const ingredientIds = Array.isArray(raw.ingredientIds)
    ? raw.ingredientIds.filter((n: any) => Number.isFinite(n)).map((n: number) => Number(n))
    : [];
  const flavorIds = Array.isArray(raw.flavorIds)
    ? raw.flavorIds.filter((id: any) => typeof id === 'string')
    : [];
  const subflavorIds = Array.isArray(raw.subflavorIds)
    ? raw.subflavorIds.filter((id: any) => typeof id === 'string')
    : [];
  const duration = Number.isFinite(raw.duration) ? Math.max(1, Number(raw.duration)) : 60;
  const categories = Array.isArray(raw.categories)
    ? raw.categories.filter((id: any) => typeof id === 'string')
    : [];
  const id = typeof raw.id === 'string' && raw.id ? raw.id : generateId();
  const createdAt =
    typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();
  const updatedAt =
    typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString();
  return {
    id,
    name: name || title || 'Untitled preset',
    title,
    description,
    color,
    colorPreset,
    ingredientIds,
    flavorIds,
    subflavorIds,
    duration,
    categories,
    createdAt,
    updatedAt,
  };
}

export function getBlockPresetState(userId: string): BlockPresetState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(blockPresetStorageKey(userId));
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    const categories: BlockPresetCategory[] = [];
    const presets: BlockPreset[] = [];
    if (Array.isArray(parsed?.categories)) {
      for (const cat of parsed.categories) {
        const sanitized = sanitizeCategory(cat);
        if (sanitized && !categories.some((c) => c.id === sanitized.id)) {
          categories.push(sanitized);
        }
      }
    }
    if (Array.isArray(parsed?.presets)) {
      for (const pre of parsed.presets) {
        const sanitized = sanitizePreset(pre);
        if (sanitized && !presets.some((p) => p.id === sanitized.id)) {
          presets.push(sanitized);
        }
      }
    }
    return { categories, presets };
  } catch {
    return DEFAULT_STATE;
  }
}

function dispatchStorageEvent(userId: string, state: BlockPresetState) {
  try {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: blockPresetStorageKey(userId),
        newValue: JSON.stringify(state),
      }),
    );
  } catch {
    // ignore
  }
}

export function saveBlockPresetState(userId: string, state: BlockPresetState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      blockPresetStorageKey(userId),
      JSON.stringify(state),
    );
    dispatchStorageEvent(userId, state);
  } catch {
    // ignore storage errors
  }
}

function upsertCategory(state: BlockPresetState, category: BlockPresetCategory) {
  const existingIndex = state.categories.findIndex((c) => c.id === category.id);
  if (existingIndex >= 0) {
    state.categories[existingIndex] = category;
  } else {
    state.categories.push(category);
  }
}

export function addBlockPresetCategory(
  userId: string,
  name: string,
): BlockPresetCategory {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name is required.');
  }
  const state = getBlockPresetState(userId);
  const existing = state.categories.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return existing;
  const category: BlockPresetCategory = {
    id: generateId(),
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
  upsertCategory(state, category);
  saveBlockPresetState(userId, state);
  return category;
}

export function addBlockPreset(
  userId: string,
  preset: Omit<BlockPreset, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
  },
): BlockPreset {
  const state = getBlockPresetState(userId);
  const now = new Date().toISOString();
  const withId: BlockPreset = {
    id: preset.id ?? generateId(),
    name: preset.name.trim() || preset.title || 'Untitled preset',
    title: preset.title,
    description: preset.description,
    color: preset.color,
    colorPreset: preset.colorPreset ?? '',
    ingredientIds: [...preset.ingredientIds],
    flavorIds: [...preset.flavorIds],
    subflavorIds: [...preset.subflavorIds],
    duration: Math.max(1, Math.round(preset.duration)),
    categories: [...preset.categories],
    createdAt: now,
    updatedAt: now,
  };
  const existingIndex = state.presets.findIndex((p) => p.id === withId.id);
  if (existingIndex >= 0) {
    state.presets[existingIndex] = withId;
  } else {
    state.presets.push(withId);
  }
  saveBlockPresetState(userId, state);
  return withId;
}

export function removeBlockPreset(userId: string, id: string) {
  const state = getBlockPresetState(userId);
  const next = state.presets.filter((p) => p.id !== id);
  if (next.length === state.presets.length) return;
  saveBlockPresetState(userId, { categories: state.categories, presets: next });
}

export function renameBlockPresetCategory(
  userId: string,
  categoryId: string,
  name: string,
) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const state = getBlockPresetState(userId);
  const idx = state.categories.findIndex((c) => c.id === categoryId);
  if (idx === -1) return;
  state.categories[idx] = {
    ...state.categories[idx],
    name: trimmed,
    updatedAt: new Date().toISOString(),
  } as BlockPresetCategory & { updatedAt?: string };
  saveBlockPresetState(userId, state);
}

export function removeBlockPresetCategory(userId: string, categoryId: string) {
  const state = getBlockPresetState(userId);
  const categories = state.categories.filter((c) => c.id !== categoryId);
  const presets = state.presets.map((p) => ({
    ...p,
    categories: p.categories.filter((id) => id !== categoryId),
  }));
  saveBlockPresetState(userId, { categories, presets });
}
