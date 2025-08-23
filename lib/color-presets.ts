export interface ColorPreset {
  name: string;
  colors: string[]; // primary, secondary, etc.
}

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Focused work',
    colors: ['#2563EB', '#22D3EE', '#F1F5F9'],
  },
  {
    name: 'Studying – detail/recall',
    colors: ['#334155', '#EF4444', '#FAFAFA'],
  },
  {
    name: 'Studying – concept building',
    colors: ['#3B82F6', '#7C3AED', '#F0F9FF'],
  },
  {
    name: 'Gym – HIIT & strength',
    colors: ['#DC2626', '#F97316', '#0B0F19'],
  },
  {
    name: 'Cardio & endurance',
    colors: ['#22C55E', '#86EFAC', '#F0FDF4'],
  },
  {
    name: 'Team sports / competition day',
    colors: ['#B91C1C', '#F59E0B', '#0A0A0A'],
  },
  {
    name: 'Planning / organizing',
    colors: ['#14B8A6', '#F59E0B', '#F8FAFC'],
  },
  {
    name: 'Admin / chores',
    colors: ['#EAB308', '#22C55E', '#FFFBEB'],
  },
  {
    name: 'Creative work',
    colors: ['#0EA5E9', '#A78BFA', '#ECFEFF'],
  },
  {
    name: 'Social / networking',
    colors: ['#F97316', '#FB7185', '#FFF7ED'],
  },
  {
    name: 'Relax / meditation',
    colors: ['#38BDF8', '#86EFAC', '#E6FFFB'],
  },
  {
    name: 'Sleep prep',
    colors: ['#D97706', '#1F2937', '#FEF3C7'],
  },
  {
    name: 'Finance / budgeting',
    colors: ['#1D4ED8', '#93C5FD', '#EFF6FF'],
  },
];

function storageKey(userId: string) {
  return `color-presets-${userId}`;
}

export function getUserColorPresets(userId: string): ColorPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (p) => typeof p?.name === 'string' && Array.isArray(p.colors),
      );
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveUserColorPresets(userId: string, presets: ColorPreset[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(presets));
  } catch {
    // ignore
  }
}

export function addUserColorPreset(userId: string, preset: ColorPreset) {
  const existing = getUserColorPresets(userId);
  if (!existing.find((p) => p.name === preset.name)) {
    existing.push(preset);
    saveUserColorPresets(userId, existing);
  }
}
