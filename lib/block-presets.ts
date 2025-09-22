export interface ActivityBlockPreset {
  id: string;
  title: string;
  description: string;
  color: string;
  colorPreset?: string;
  ingredientIds: number[];
  flavorIds: string[];
  subflavorIds: string[];
  duration: number;
  categoryIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BlockPresetCategory {
  id: string;
  name: string;
  createdAt: string;
}

function generateId() {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      // @ts-ignore randomUUID existence checked above
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return Math.random().toString(36).slice(2, 11);
}

export function userBlockPresetsKey(userId: string) {
  return `block-presets-${userId}`;
}

export function userBlockPresetCategoriesKey(userId: string) {
  return `block-preset-categories-${userId}`;
}

function sanitizePreset(raw: any): ActivityBlockPreset | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' ? raw.id : generateId();
  const title = typeof raw.title === 'string' ? raw.title : '';
  const description = typeof raw.description === 'string' ? raw.description : '';
  const color = typeof raw.color === 'string' ? raw.color : '#F87171';
  const colorPreset = typeof raw.colorPreset === 'string' ? raw.colorPreset : '';
  const duration = Number.isFinite(raw.duration) ? Math.max(15, Number(raw.duration)) : 60;
  const ingredientIds = Array.isArray(raw.ingredientIds)
    ? raw.ingredientIds.filter((n: unknown) => typeof n === 'number')
    : [];
  const flavorIds = Array.isArray(raw.flavorIds)
    ? raw.flavorIds.filter((n: unknown) => typeof n === 'string')
    : [];
  const subflavorIds = Array.isArray(raw.subflavorIds)
    ? raw.subflavorIds.filter((n: unknown) => typeof n === 'string')
    : [];
  const categoryIds = Array.isArray(raw.categoryIds)
    ? raw.categoryIds.filter((n: unknown) => typeof n === 'string')
    : [];
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt;
  return {
    id,
    title,
    description,
    color,
    colorPreset,
    ingredientIds,
    flavorIds,
    subflavorIds,
    duration,
    categoryIds,
    createdAt,
    updatedAt,
  };
}

function sanitizeCategory(raw: any): BlockPresetCategory | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' ? raw.id : generateId();
  const name = typeof raw.name === 'string' ? raw.name : '';
  if (!name.trim()) return null;
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();
  return { id, name, createdAt };
}

export function getUserBlockPresets(userId: string): ActivityBlockPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(userBlockPresetsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const sanitized: ActivityBlockPreset[] = [];
    let needsSave = false;
    for (const entry of parsed) {
      const preset = sanitizePreset(entry);
      if (preset) {
        if (entry?.id !== preset.id) needsSave = true;
        sanitized.push(preset);
      }
    }
    if (needsSave) saveUserBlockPresets(userId, sanitized);
    return sanitized;
  } catch {
    return [];
  }
}

export function saveUserBlockPresets(userId: string, presets: ActivityBlockPreset[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(userBlockPresetsKey(userId), JSON.stringify(presets));
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: userBlockPresetsKey(userId),
        newValue: JSON.stringify(presets),
      }),
    );
  } catch {
    // ignore
  }
}

export function addUserBlockPreset(
  userId: string,
  preset: Omit<ActivityBlockPreset, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): ActivityBlockPreset {
  const existing = getUserBlockPresets(userId);
  const now = new Date().toISOString();
  const fullPreset: ActivityBlockPreset = {
    ...preset,
    id: preset.id ?? generateId(),
    createdAt: preset.createdAt ?? now,
    updatedAt: preset.updatedAt ?? now,
    categoryIds: [...new Set(preset.categoryIds ?? [])],
    ingredientIds: Array.isArray(preset.ingredientIds) ? preset.ingredientIds : [],
    flavorIds: Array.isArray(preset.flavorIds) ? preset.flavorIds : [],
    subflavorIds: Array.isArray(preset.subflavorIds) ? preset.subflavorIds : [],
    duration: Math.max(15, Math.floor(preset.duration ?? 60)),
    color: preset.color || '#F87171',
    title: preset.title ?? '',
    description: preset.description ?? '',
    colorPreset: preset.colorPreset ?? '',
  };
  const withoutCurrent = existing.filter((p) => p.id !== fullPreset.id);
  withoutCurrent.push(fullPreset);
  saveUserBlockPresets(userId, withoutCurrent);
  return fullPreset;
}

export function removeUserBlockPreset(userId: string, presetId: string) {
  const existing = getUserBlockPresets(userId);
  const filtered = existing.filter((p) => p.id !== presetId);
  saveUserBlockPresets(userId, filtered);
}

export function getUserBlockPresetCategories(userId: string): BlockPresetCategory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(userBlockPresetCategoriesKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const sanitized: BlockPresetCategory[] = [];
    let needsSave = false;
    for (const entry of parsed) {
      const cat = sanitizeCategory(entry);
      if (cat) {
        if (entry?.id !== cat.id) needsSave = true;
        sanitized.push(cat);
      }
    }
    if (needsSave) saveUserBlockPresetCategories(userId, sanitized);
    return sanitized;
  } catch {
    return [];
  }
}

export function saveUserBlockPresetCategories(
  userId: string,
  categories: BlockPresetCategory[],
) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      userBlockPresetCategoriesKey(userId),
      JSON.stringify(categories),
    );
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: userBlockPresetCategoriesKey(userId),
        newValue: JSON.stringify(categories),
      }),
    );
  } catch {
    // ignore
  }
}

export function addBlockPresetCategory(userId: string, name: string): BlockPresetCategory | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = getUserBlockPresetCategories(userId);
  const found = existing.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  const now = new Date().toISOString();
  const category: BlockPresetCategory = {
    id: generateId(),
    name: trimmed,
    createdAt: now,
  };
  existing.push(category);
  saveUserBlockPresetCategories(userId, existing);
  return category;
}

export function removeBlockPresetCategory(userId: string, categoryId: string) {
  const categories = getUserBlockPresetCategories(userId);
  const filtered = categories.filter((c) => c.id !== categoryId);
  saveUserBlockPresetCategories(userId, filtered);
  const presets = getUserBlockPresets(userId);
  let changed = false;
  const updated = presets.map((p) => {
    if (!p.categoryIds?.includes(categoryId)) return p;
    const next = {
      ...p,
      categoryIds: p.categoryIds.filter((id) => id !== categoryId),
      updatedAt: new Date().toISOString(),
    };
    changed = true;
    return next;
  });
  if (changed) saveUserBlockPresets(userId, updated);
}
