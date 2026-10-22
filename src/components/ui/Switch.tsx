"use client";

type SwitchProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** On/off toggle; the state is also written out ("Açık"/"Kapalı") so it doesn't rely on color. */
export default function Switch({ label, description, checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </span>
      <span className={`w-14 text-right text-sm font-semibold ${checked ? "text-accent" : "text-muted"}`}>
        {checked ? "Açık" : "Kapalı"}
      </span>
      <span
        aria-hidden
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-raised ring-1 ring-line"}`}
      >
        <span
          className={`absolute top-1 size-6 rounded-full transition-all ${checked ? "left-7 bg-on-accent" : "left-1 bg-muted"}`}
        />
      </span>
    </button>
  );
}
