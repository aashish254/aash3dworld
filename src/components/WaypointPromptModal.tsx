import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';

interface WaypointPromptModalProps {
  coords: { x: number; z: number } | null;
  onCancel: () => void;
  onSave: (label: string, color: string) => void;
}

const FLAG_COLORS = [
  { id: '#f59e0b', name: 'Saffron' },
  { id: '#10b981', name: 'Emerald' },
  { id: '#38bdf8', name: 'Himalayan Sky' },
  { id: '#f43f5e', name: 'Rhododendron' },
];

export const WaypointPromptModal: React.FC<WaypointPromptModalProps> = ({
  coords,
  onCancel,
  onSave,
}) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#f59e0b');
  const [error, setError] = useState<string | null>(null);

  if (!coords) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = label.trim();
    if (clean.length < 2) {
      setError('Enter a short marker title (at least 2 characters).');
      return;
    }
    setError(null);
    onSave(clean, color);
    setLabel('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(7, 11, 20, 0.78)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="marker-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/15 shadow-2xl p-6"
        style={{ backgroundColor: '#0f1724' }}
      >
        <div className="flex items-center justify-between">
          <h2
            id="marker-modal-title"
            className="text-lg font-bold text-slate-50 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Flag className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>Place Trail Marker</span>
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel marker placement"
            className="w-8 h-8 rounded-lg border border-white/12 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-1 text-xs font-mono tabular-nums text-slate-400">
          Coordinates: x={Math.round(coords.x)}, z={Math.round(coords.z)}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="marker-label" className="block text-xs font-medium text-slate-300 mb-1.5">
              Marker Label
            </label>
            <input
              id="marker-label"
              type="text"
              maxLength={32}
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Sunset Ridge"
              className="w-full rounded-lg border border-white/15 bg-[#152033] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-300 mb-2">Flag Color</span>
            <div className="flex items-center gap-2.5">
              {FLAG_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  aria-label={c.name}
                  className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform ${
                    color === c.id ? 'border-white scale-110' : 'border-transparent opacity-75'
                  }`}
                  style={{ backgroundColor: c.id }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-white/15 text-xs font-medium text-slate-200 hover:bg-white/10 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer"
            >
              Plant Flag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
