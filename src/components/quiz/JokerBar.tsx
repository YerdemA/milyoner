"use client";

import type { JokerName } from "@/lib/quizEngine";
import { EXTRA_TIME_SEC } from "@/lib/quizConfig";
import type { JokerSettings } from "@/types";

const JOKERS: { name: JokerName; icon: string; label: string; title: string }[] = [
  { name: "fiftyFifty", icon: "½", label: "Yarı yarıya", title: "Doğru cevapla birlikte yalnızca bir yanlış şık kalır" },
  { name: "doubleAnswer", icon: "×2", label: "Çift cevap", title: "İlk tahmin yanlışsa ikinci tahmin hakkı (doğruysa yarım puan)" },
  { name: "extraTime", icon: "+", label: `${EXTRA_TIME_SEC} sn`, title: `Süreye ${EXTRA_TIME_SEC} saniye ekler` },
];

type JokerBarProps = {
  enabled: JokerSettings;
  used: Record<JokerName, boolean>;
  /** Whether each joker can be used right now (phase, question type...). */
  available: Record<JokerName, boolean>;
  active: Partial<Record<JokerName, boolean>>;
  onUse: (name: JokerName) => void;
};

export default function JokerBar({ enabled, used, available, active, onUse }: JokerBarProps) {
  const visible = JOKERS.filter((j) => enabled[j.name]);
  if (visible.length === 0) return null;

  return (
    <div className="flex gap-2" role="group" aria-label="Jokerler">
      {visible.map((j) => {
        const isUsed = used[j.name];
        const isActive = active[j.name];
        return (
          <button
            key={j.name}
            type="button"
            title={j.title}
            disabled={isUsed || !available[j.name]}
            onClick={() => onUse(j.name)}
            className={`relative flex items-center gap-2 rounded-full border-2 px-4 py-2 text-[clamp(0.85rem,1.1vw,1.15rem)] font-bold transition-colors ${
              isActive
                ? "border-accent bg-accent text-on-accent"
                : isUsed
                  ? "border-line text-muted line-through opacity-50"
                  : "border-accent/70 text-accent hover:bg-accent/15 disabled:opacity-40"
            }`}
          >
            <span aria-hidden className="text-[1.2em] leading-none">{j.icon}</span>
            {j.label}
            {isUsed && !isActive && <span className="sr-only">(kullanıldı)</span>}
          </button>
        );
      })}
    </div>
  );
}
