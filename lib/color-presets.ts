export interface ColorPreset {
  id: string;
  name: string;
  colors: string[]; // primary, secondary, etc.
}

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  {
    id: slug('Focused work'),
    name: 'Focused work',
    colors: ['#2563EB', '#22D3EE', '#F1F5F9'],
  },
  {
    id: slug('Studying – detail/recall'),
    name: 'Studying – detail/recall',
    colors: ['#334155', '#EF4444', '#FAFAFA'],
  },
  {
    id: slug('Studying – concept building'),
    name: 'Studying – concept building',
    colors: ['#3B82F6', '#7C3AED', '#F0F9FF'],
  },
  {
    id: slug('Gym – HIIT & strength'),
    name: 'Gym – HIIT & strength',
    colors: ['#DC2626', '#F97316', '#0B0F19'],
  },
  {
    id: slug('Cardio & endurance'),
    name: 'Cardio & endurance',
    colors: ['#22C55E', '#86EFAC', '#F0FDF4'],
  },
  {
    id: slug('Team sports / competition day'),
    name: 'Team sports / competition day',
    colors: ['#B91C1C', '#F59E0B', '#0A0A0A'],
  },
  {
    id: slug('Planning / organizing'),
    name: 'Planning / organizing',
    colors: ['#14B8A6', '#F59E0B', '#F8FAFC'],
  },
  {
    id: slug('Admin / chores'),
    name: 'Admin / chores',
    colors: ['#EAB308', '#22C55E', '#FFFBEB'],
  },
  {
    id: slug('Creative work'),
    name: 'Creative work',
    colors: ['#0EA5E9', '#A78BFA', '#ECFEFF'],
  },
  {
    id: slug('Social / networking'),
    name: 'Social / networking',
    colors: ['#F97316', '#FB7185', '#FFF7ED'],
  },
  {
    id: slug('Relax / meditation'),
    name: 'Relax / meditation',
    colors: ['#38BDF8', '#86EFAC', '#E6FFFB'],
  },
  {
    id: slug('Sleep prep'),
    name: 'Sleep prep',
    colors: ['#D97706', '#1F2937', '#FEF3C7'],
  },
  {
    id: slug('Finance / budgeting'),
    name: 'Finance / budgeting',
    colors: ['#1D4ED8', '#93C5FD', '#EFF6FF'],
  },
];

export function userColorPresetsKey(userId: string) {
  return `color-presets-${userId}`;
}

export function getUserColorPresets(userId: string): ColorPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(userColorPresetsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (p) =>
          typeof p?.id === 'string' &&
          typeof p?.name === 'string' &&
          Array.isArray(p.colors),
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
    window.localStorage.setItem(
      userColorPresetsKey(userId),
      JSON.stringify(presets),
    );
  } catch {
    // ignore
  }
}

export function addUserColorPreset(userId: string, preset: ColorPreset) {
  const existing = getUserColorPresets(userId);
  existing.push(preset);
  saveUserColorPresets(userId, existing);
  // Manually dispatch a storage event so open pages update immediately
  try {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: userColorPresetsKey(userId),
        newValue: JSON.stringify(existing),
      }),
    );
  } catch {
    // ignore
  }
}

export function removeUserColorPreset(userId: string, id: string) {
  const existing = getUserColorPresets(userId);
  const next = existing.filter((p) => p.id !== id);
  saveUserColorPresets(userId, next);
}
