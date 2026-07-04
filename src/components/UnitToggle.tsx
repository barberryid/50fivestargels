// Shared "measurement system" toggle for the calculator + prompt generator.
// Persists the choice to localStorage so picking one on either page carries
// over to the other.
import { useEffect, useState } from 'react';
import type { UnitSystem } from '../lib/units';

const STORAGE_KEY = 'gels-unit-system';

export function useUnitSystem(): [UnitSystem, (system: UnitSystem) => void] {
  const [system, setSystemState] = useState<UnitSystem>('metric');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'metric' || saved === 'us' || saved === 'uk') setSystemState(saved);
  }, []);

  const setSystem = (next: UnitSystem) => {
    setSystemState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return [system, setSystem];
}

const OPTIONS: Array<{ key: UnitSystem; label: string }> = [
  { key: 'metric', label: 'Metric' },
  { key: 'us', label: 'American' },
  { key: 'uk', label: 'UK Hybrid' },
];

interface Props {
  value: UnitSystem;
  onChange: (system: UnitSystem) => void;
}

export default function UnitToggle({ value, onChange }: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Measurement system">
      <span className="font-sans text-[11px] font-extrabold uppercase tracking-[0.12em] text-text-muted">
        Units
      </span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          role="radio"
          aria-checked={value === opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-full border px-3.5 py-2 font-sans text-[13px] font-bold transition-colors ${
            value === opt.key
              ? 'border-accent bg-accent text-bg'
              : 'border-border bg-white text-text-muted hover:border-accent-deep hover:text-text'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
