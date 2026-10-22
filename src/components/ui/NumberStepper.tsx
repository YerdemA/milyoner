"use client";

import { useId, useState } from "react";

type NumberStepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Big −/+ buttons for the projector, plus a typeable field. Typed values are clamped on blur. */
export default function NumberStepper({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  hint,
  disabled,
  onChange,
}: NumberStepperProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  function commit(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) onChange(clamp(parsed, min, max));
    setDraft(null);
  }

  const buttonClass =
    "flex size-12 shrink-0 items-center justify-center rounded-lg border border-line bg-raised text-2xl font-bold hover:border-muted disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={`flex flex-col gap-2 ${disabled ? "opacity-40" : ""}`}>
      <label htmlFor={id} className="text-lg font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(clamp(value - step, min, max))}
          disabled={disabled || value <= min}
          aria-label={`${label}: azalt`}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(e.currentTarget.value);
            }
          }}
          className="h-12 w-24 rounded-lg border border-line bg-bg text-center text-2xl font-bold tabular-nums focus:border-accent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(clamp(value + step, min, max))}
          disabled={disabled || value >= max}
          aria-label={`${label}: artır`}
        >
          +
        </button>
        {suffix && <span className="text-lg text-muted">{suffix}</span>}
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
