"use client";

import { motion } from "framer-motion";

export type OptionStatus =
  | "idle"
  | "locked" // chosen, waiting for the reveal
  | "eliminated" // removed by 50:50
  | "wrongPick" // first wrong guess with the double answer joker
  | "correct"
  | "chosenWrong"
  | "dimmed";

// Every state has a text label too: projector colors can look washed out.
const STYLES: Record<OptionStatus, { box: string; badge: string; label?: string }> = {
  idle: { box: "border-line bg-surface hover:border-accent hover:bg-raised", badge: "bg-raised text-accent" },
  locked: { box: "border-accent bg-accent/20 shadow-[0_0_40px_-6px] shadow-accent/70", badge: "bg-accent text-on-accent", label: "Kilitlendi" },
  eliminated: { box: "border-line/40 bg-surface/30 opacity-30", badge: "bg-raised text-muted", label: "Elendi" },
  wrongPick: { box: "border-danger/70 bg-danger/10 opacity-70", badge: "bg-danger text-bg", label: "✗ İlk tahmin" },
  correct: { box: "border-success bg-success/20 shadow-[0_0_50px_-6px] shadow-success/70", badge: "bg-success text-bg", label: "✓ Doğru cevap" },
  chosenWrong: { box: "border-danger bg-danger/20", badge: "bg-danger text-bg", label: "✗ Verilen cevap" },
  dimmed: { box: "border-line/60 bg-surface/60 opacity-50", badge: "bg-raised text-muted" },
};

type OptionButtonProps = {
  letter: string;
  text: string;
  status: OptionStatus;
  disabled: boolean;
  index: number;
  onSelect: () => void;
};

export default function OptionButton({ letter, text, status, disabled, index, onSelect }: OptionButtonProps) {
  const style = STYLES[status];
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={`${letter} şıkkı: ${text}${style.label ? ` (${style.label})` : ""}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, scale: status === "correct" ? 1.02 : 1 }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.35 }}
      className={`flex w-full items-center gap-[1.2vw] rounded-2xl border-2 px-[1.2vw] py-[1.4vh] text-left transition-colors disabled:cursor-default ${style.box}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl font-black ${style.badge}`}
        style={{ width: "clamp(2.5rem, 4vw, 4.5rem)", height: "clamp(2.5rem, 4vw, 4.5rem)", fontSize: "clamp(1.25rem, 2vw, 2.25rem)" }}
      >
        {letter}
      </span>
      <span
        className={`min-w-0 flex-1 font-semibold leading-snug ${status === "eliminated" ? "line-through" : ""}`}
        style={{ fontSize: "clamp(1.15rem, 2vw, 2.25rem)" }}
      >
        {text}
      </span>
      {style.label && (
        <span className="shrink-0 rounded-lg bg-bg/60 px-3 py-1 text-[clamp(0.8rem,1.1vw,1.25rem)] font-bold">
          {style.label}
        </span>
      )}
    </motion.button>
  );
}
