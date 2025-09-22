'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  addBlockPresetCategory,
  blockPresetStorageKey,
  getBlockPresetState,
  type BlockPreset,
} from '@/lib/block-presets';

const UNCATEGORIZED_ID = '__uncategorized';

interface BlockPresetLibraryProps {
  userId: string;
  editable: boolean;
  onSelect: (preset: BlockPreset) => void;
  onClose: () => void;
}

function formatDuration(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export default function BlockPresetLibrary({
  userId,
  editable,
  onSelect,
  onClose,
}: BlockPresetLibraryProps) {
  const [state, setState] = useState(() => getBlockPresetState(userId));
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    setState(getBlockPresetState(userId));
  }, [userId]);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === blockPresetStorageKey(userId)) {
        setState(getBlockPresetState(userId));
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [userId]);

  const categoryLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of state.categories) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [state.categories]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredPresets = useMemo(() => {
    let list = [...state.presets];
    if (filters.length > 0) {
      list = list.filter((preset) => {
        const ids = preset.categories.length
          ? preset.categories
          : [UNCATEGORIZED_ID];
        return filters.every((id) => ids.includes(id));
      });
    }
    if (normalizedSearch) {
      list = list.filter((preset) => {
        const haystack = [preset.name, preset.title, preset.description]
          .filter(Boolean)
          .map((value) => value.toLowerCase());
        return haystack.some((value) => value.includes(normalizedSearch));
      });
    }
    return list;
  }, [state.presets, filters, normalizedSearch]);

  const sections = useMemo(() => {
    if (filters.length > 0) {
      return [
        {
          id: 'filtered',
          title: 'Filtered presets',
          presets: filteredPresets,
        },
      ];
    }
    const map = new Map<string, BlockPreset[]>();
    for (const preset of filteredPresets) {
      const ids = preset.categories.length
        ? preset.categories
        : [UNCATEGORIZED_ID];
      for (const id of ids) {
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push(preset);
      }
    }
    const ordered: { id: string; title: string; presets: BlockPreset[] }[] = [];
    for (const cat of state.categories) {
      ordered.push({
        id: cat.id,
        title: cat.name,
        presets: map.get(cat.id) ?? [],
      });
      map.delete(cat.id);
    }
    if (map.has(UNCATEGORIZED_ID) || filteredPresets.some((p) => p.categories.length === 0)) {
      ordered.push({
        id: UNCATEGORIZED_ID,
        title: 'Uncategorized',
        presets: map.get(UNCATEGORIZED_ID) ?? [],
      });
      map.delete(UNCATEGORIZED_ID);
    }
    for (const [id, presets] of map.entries()) {
      ordered.push({
        id,
        title: categoryLookup.get(id) ?? 'Other',
        presets,
      });
    }
    return ordered;
  }, [filteredPresets, filters, state.categories, categoryLookup]);

  const activeFilterCount = filters.length;

  function toggleFilter(id: string) {
    setFilters((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function handleAddCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    try {
      const created = addBlockPresetCategory(userId, trimmed);
      setState((prev) => {
        if (prev.categories.some((cat) => cat.id === created.id)) return prev;
        return {
          categories: [...prev.categories, created],
          presets: prev.presets,
        };
      });
      setNewCategory('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to add category';
      alert(message);
    }
  }

  return (
    <div className="w-80 max-w-[calc(100vw-3rem)] rounded border bg-white p-3 text-sm shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">Saved activity blocks</span>
        <Button size="sm" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
      <input
        className="w-full rounded border px-2 py-1 text-sm"
        placeholder="Search presets"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-1">
        <button
          className={cn(
            'rounded border px-2 py-1 text-xs',
            activeFilterCount === 0
              ? 'border-orange-400 bg-orange-50 text-orange-600'
              : 'border-gray-300 text-gray-600 hover:bg-gray-100',
          )}
          onClick={() => setFilters([])}
        >
          All
        </button>
        {state.categories.map((category) => (
          <button
            key={category.id}
            className={cn(
              'rounded border px-2 py-1 text-xs',
              filters.includes(category.id)
                ? 'border-orange-400 bg-orange-50 text-orange-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100',
            )}
            onClick={() => toggleFilter(category.id)}
          >
            {category.name}
          </button>
        ))}
        <button
          className={cn(
            'rounded border px-2 py-1 text-xs',
            filters.includes(UNCATEGORIZED_ID)
              ? 'border-orange-400 bg-orange-50 text-orange-600'
              : 'border-gray-300 text-gray-600 hover:bg-gray-100',
          )}
          onClick={() => toggleFilter(UNCATEGORIZED_ID)}
        >
          Uncategorized
        </button>
      </div>
      {activeFilterCount > 0 && filteredPresets.length === 0 ? (
        <div className="mt-3 rounded border border-dashed p-3 text-center text-xs text-gray-500">
          No presets match your filters.
        </div>
      ) : null}
      <div className="mt-3 max-h-64 overflow-y-auto pr-1">
        {sections.map((section) => (
          <div key={section.id} className="mb-3 last:mb-0">
            {filters.length === 0 && (
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {section.title}
              </div>
            )}
            {section.presets.length > 0 ? (
              section.presets.map((preset) => (
                <div key={preset.id} className="mb-2 rounded border p-2 last:mb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded"
                          style={{ background: preset.color }}
                        />
                        <span className="font-medium">{preset.name}</span>
                      </div>
                      {preset.title && preset.title !== preset.name ? (
                        <div className="mt-1 text-xs text-gray-500">
                          Activity title: {preset.title}
                        </div>
                      ) : null}
                      {preset.description ? (
                        <div className="mt-1 whitespace-pre-wrap text-xs text-gray-600">
                          {preset.description}
                        </div>
                      ) : null}
                      <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                        Duration: {formatDuration(preset.duration)}
                      </div>
                      {preset.categories.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-gray-500">
                          {preset.categories.map((categoryId) => (
                            <span
                              key={`${preset.id}-${categoryId}`}
                              className="rounded bg-gray-200 px-1.5 py-0.5"
                            >
                              {categoryLookup.get(categoryId) ?? 'Other'}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <Button size="sm" onClick={() => onSelect(preset)}>
                      Add
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded border border-dashed p-3 text-xs text-gray-500">
                No presets in this category yet.
              </div>
            )}
          </div>
        ))}
        {sections.length === 0 && (
          <div className="rounded border border-dashed p-3 text-center text-xs text-gray-500">
            No presets saved yet. Open an activity and choose “Save activity block” to
            build your library.
          </div>
        )}
      </div>
      {editable && (
        <div className="mt-3 border-t pt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Create category
          </div>
          <div className="mt-1 flex items-center gap-2">
            <input
              className="flex-1 rounded border px-2 py-1 text-xs"
              placeholder="e.g. Morning"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
            />
            <Button size="sm" onClick={handleAddCategory}>
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
