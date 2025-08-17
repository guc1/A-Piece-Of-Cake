import { Flavor, FlavorInput } from '@/types/flavor';

const store = new Map<string, Flavor[]>();

function sortFlavors(list: Flavor[]) {
  return list.sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function listFlavors(userId: string): Flavor[] {
  const list = store.get(userId) ?? [];
  return sortFlavors([...list]);
}

export function createFlavor(userId: string, input: FlavorInput): Flavor {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const flavor: Flavor = {
    ...input,
    id,
    userId,
    slug: input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
    name: input.name.slice(0, 40),
    description: input.description.slice(0, 280),
    color: input.color,
    icon: input.icon,
    importance: clamp(input.importance),
    targetMix: clamp(input.targetMix),
    visibility: input.visibility,
    orderIndex: input.orderIndex ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  const list = store.get(userId) ?? [];
  list.push(flavor);
  store.set(userId, list);
  return flavor;
}

export function updateFlavor(userId: string, id: string, input: Partial<FlavorInput>): Flavor | null {
  const list = store.get(userId);
  if (!list) return null;
  const idx = list.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const existing = list[idx];
  const updated: Flavor = {
    ...existing,
    ...input,
    name: input.name ? input.name.slice(0, 40) : existing.name,
    description: input.description ? input.description.slice(0, 280) : existing.description,
    importance: input.importance !== undefined ? clamp(input.importance) : existing.importance,
    targetMix: input.targetMix !== undefined ? clamp(input.targetMix) : existing.targetMix,
    color: input.color ?? existing.color,
    icon: input.icon ?? existing.icon,
    visibility: input.visibility ?? existing.visibility,
    orderIndex: input.orderIndex ?? existing.orderIndex,
    updatedAt: now,
  };
  list[idx] = updated;
  return updated;
}

export function deleteFlavor(userId: string, id: string): boolean {
  const list = store.get(userId);
  if (!list) return false;
  const idx = list.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
