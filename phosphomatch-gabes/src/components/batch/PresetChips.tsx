import type { BatchPreset } from '../../data/presets';
import { batchPresets } from '../../data/presets';

export function PresetChips({ onSelect }: { onSelect: (preset: BatchPreset) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {batchPresets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-left text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
          onClick={() => onSelect(preset)}
        >
          {preset.label}
          <span className="block text-xs font-normal text-muted">{preset.description}</span>
        </button>
      ))}
    </div>
  );
}
