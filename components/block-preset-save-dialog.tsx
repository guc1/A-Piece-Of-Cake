'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  addBlockPreset,
  addBlockPresetCategory,
  blockPresetStorageKey,
  getBlockPresetState,
  type BlockPreset,
} from '@/lib/block-presets';
import type { PlanBlock } from '@/types/plan';

interface BlockPresetSaveDialogProps {
  userId: string;
  block: PlanBlock;
  duration: number;
  onClose: () => void;
  onSaved?: (preset: BlockPreset) => void;
}

export default function BlockPresetSaveDialog({
  userId,
  block,
  duration,
  onClose,
  onSaved,
}: BlockPresetSaveDialogProps) {
  const [state, setState] = useState(() => getBlockPresetState(userId));
  const [name, setName] = useState(() => block.title?.trim() || 'Untitled activity');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    setName(block.title?.trim() || 'Untitled activity');
    setSelectedCategories([]);
    setError(null);
  }, [block.id, block.title]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const durationText = useMemo(() => {
    const safe = Math.max(0, Math.round(duration));
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    if (m) return `${m}m`;
    return '0m';
  }, [duration]);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
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
      setSelectedCategories((prev) =>
        prev.includes(created.id) ? prev : [...prev, created.id],
      );
      setNewCategory('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to add category';
      alert(message);
    }
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please give this preset a name.');
      return;
    }
    if (duration <= 0) {
      setError('Activity duration must be greater than zero.');
      return;
    }
    const preset = addBlockPreset(userId, {
      name: trimmed,
      title: block.title,
      description: block.description,
      color: block.color,
      colorPreset: block.colorPreset ?? '',
      ingredientIds: [...(block.ingredientIds ?? [])],
      flavorIds: [...(block.flavorIds ?? [])],
      subflavorIds: [...(block.subflavorIds ?? [])],
      duration,
      categories: selectedCategories,
    });
    onSaved?.(preset);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[200000] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded bg-white p-4 text-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <div className="text-base font-semibold">Save activity block</div>
            <div className="text-xs text-gray-500">
              {block.title?.trim() ? block.title : 'Untitled activity'}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Preset name
        </label>
        <input
          className="mt-1 w-full rounded border px-2 py-1 text-sm"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Categories
          </div>
          {state.categories.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {state.categories.map((category) => (
                <button
                  key={category.id}
                  className={cn(
                    'rounded border px-2 py-1 text-xs',
                    selectedCategories.includes(category.id)
                      ? 'border-orange-400 bg-orange-50 text-orange-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100',
                  )}
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-1 rounded border border-dashed p-3 text-xs text-gray-500">
              No categories yet. Add one below to organise your presets.
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <input
              className="flex-1 rounded border px-2 py-1 text-xs"
              placeholder="Add a category"
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
        <div className="mt-4 rounded border bg-gray-50 p-3 text-xs text-gray-600">
          <div>
            <span className="font-semibold text-gray-700">Duration:</span> {durationText}
          </div>
          {block.description ? (
            <div className="mt-2">
              <div className="font-semibold text-gray-700">Description</div>
              <div className="whitespace-pre-wrap text-gray-600">{block.description}</div>
            </div>
          ) : null}
        </div>
        {error ? (
          <div className="mt-3 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-600">
            {error}
          </div>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave}>Save activity block</Button>
        </div>
      </div>
    </div>
  );
}
