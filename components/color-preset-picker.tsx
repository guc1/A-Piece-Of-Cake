'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_COLOR_PRESETS,
  ColorPreset,
  getUserColorPresets,
  saveUserColorPresets,
} from '@/lib/color-presets';
import { useViewContext } from '@/lib/view-context';

interface PickerProps {
  userId: string;
  onSelect: (p: { name: string; color: string }) => void;
  onClose: () => void;
}

export default function ColorPresetPicker({
  userId,
  onSelect,
  onClose,
}: PickerProps) {
  const { editable } = useViewContext();
  const [custom, setCustom] = useState<ColorPreset[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');

  useEffect(() => {
    setCustom(getUserColorPresets(userId));
  }, [userId]);

  function handleSave() {
    if (!name.trim()) return;
    const preset = { name: name.trim(), colors: [color] };
    const next = [...custom, preset];
    setCustom(next);
    saveUserColorPresets(userId, next);
    setName('');
    onSelect({ name: preset.name, color: preset.colors[0] });
  }

  return (
    <div className="w-64 rounded border bg-white p-2 text-sm shadow">
      <div className="mb-2 font-semibold">Your presets</div>
      {custom.length > 0 ? (
        custom.map((p) => (
          <button
            key={p.name}
            className="mb-1 flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-gray-100"
            onClick={() => onSelect({ name: p.name, color: p.colors[0] })}
          >
            <span
              className="h-4 w-4 rounded"
              style={{ background: p.colors[0] }}
            ></span>
            <span>{p.name}</span>
          </button>
        ))
      ) : (
        <div className="mb-2 text-gray-500">No presets yet</div>
      )}
      <div className="mt-2 mb-2 font-semibold">Presets</div>
      {DEFAULT_COLOR_PRESETS.map((p) => (
        <button
          key={p.name}
          className="mb-1 flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-gray-100"
          onClick={() => onSelect({ name: p.name, color: p.colors[0] })}
        >
          <span
            className="h-4 w-4 rounded"
            style={{ background: p.colors[0] }}
          ></span>
          <span>{p.name}</span>
        </button>
      ))}
      {editable && (
        <div className="mt-2 flex items-center gap-1">
          <input
            className="w-full border p-1 text-xs"
            value={name}
            placeholder="Title"
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="color"
            className="h-8 w-8 border p-0"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <Button size="sm" onClick={handleSave} id="clr-pre-add">
            Save
          </Button>
        </div>
      )}
      <div className="mt-2 text-right">
        <Button size="sm" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
