"use client";

import { useTheme } from "@/hooks/useTheme";
import { THEMES } from "@/lib/theme";

/** Three-way theme picker. Each swatch renders inside its own theme, so it shows the real colors. */
export default function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div role="radiogroup" aria-label="Renk teması" className={`inline-flex gap-1 rounded-xl border border-line bg-surface p-1 ${className}`}>
      {THEMES.map((t) => {
        const selected = t.id === theme;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={t.hint}
            onClick={() => setTheme(t.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
              selected ? "bg-raised text-fg" : "text-muted hover:text-fg"
            }`}
          >
            <span data-theme={t.id} aria-hidden className="flex size-5 overflow-hidden rounded-full border border-line bg-bg">
              <span className="m-auto flex gap-px">
                <span className="size-1.5 rounded-full bg-accent" />
                <span className="size-1.5 rounded-full bg-accent-strong" />
              </span>
            </span>
            {t.label}
            {selected && <span className="sr-only">(seçili)</span>}
          </button>
        );
      })}
    </div>
  );
}
