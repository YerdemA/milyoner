"use client";

import { motion, type TargetAndTransition, type Transition } from "framer-motion";

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
  locked: { box: "border-accent bg-accent/20", badge: "bg-accent text-on-accent", label: "Kilitlendi" },
  eliminated: { box: "border-line/40 bg-surface/30", badge: "bg-raised text-muted", label: "Elendi" },
  wrongPick: { box: "border-danger/70 bg-danger/10", badge: "bg-danger text-bg", label: "✗ İlk tahmin" },
  correct: { box: "border-success bg-success/20", badge: "bg-success text-bg", label: "✓ Doğru cevap" },
  chosenWrong: { box: "border-danger bg-danger/20", badge: "bg-danger text-bg", label: "✗ Verilen cevap" },
  dimmed: { box: "border-line/60 bg-surface/60", badge: "bg-raised text-muted" },
};

// The glow is a separate layer whose opacity is animated, so its color can come from the
// theme's CSS variables (Framer Motion cannot interpolate box-shadows that use var()).
const GLOW_COLOR: Partial<Record<OptionStatus, string>> = { locked: "--color-accent", correct: "--color-success" };

/** Per-status motion: entrance is handled separately so these play without delay. */
function motionFor(status: OptionStatus): { animate: TargetAndTransition; transition: Transition; glow: TargetAndTransition; glowTransition: Transition } {
  const noGlow = { glow: { opacity: 0 }, glowTransition: { duration: 0.3 } };
  switch (status) {
    case "locked":
      return {
        animate: { opacity: 1, scale: 1.02 },
        transition: { duration: 0.2 },
        glow: { opacity: [0.3, 1, 0.3] },
        glowTransition: { duration: 0.9, repeat: Infinity },
      };
    case "correct":
      return {
        animate: { opacity: 1, scale: [1, 1.08, 1.03] },
        transition: { duration: 0.7, ease: "easeOut" },
        glow: { opacity: [0, 1, 0.6] },
        glowTransition: { duration: 0.7, ease: "easeOut" },
      };
    case "chosenWrong":
      return {
        animate: { opacity: 1, scale: 1, x: [0, -16, 16, -12, 12, -6, 6, 0] },
        transition: { x: { duration: 0.55 }, default: { duration: 0.3 } },
        ...noGlow,
      };
    case "eliminated":
      return { animate: { opacity: 0.25, scale: 0.97 }, transition: { duration: 0.5 }, ...noGlow };
    case "wrongPick":
      return { animate: { opacity: 0.7, scale: 1, x: [0, -10, 10, -6, 6, 0] }, transition: { duration: 0.45 }, ...noGlow };
    case "dimmed":
      return { animate: { opacity: 0.45, scale: 0.98 }, transition: { duration: 0.4 }, ...noGlow };
    default:
      return { animate: { opacity: 1, scale: 1 }, transition: { duration: 0.25 }, ...noGlow };
  }
}

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
  const { animate, transition, glow, glowTransition } = motionFor(status);
  const glowColor = GLOW_COLOR[status] ?? "--color-accent";

  return (
    // Outer element: one-time staggered entrance. Inner button: status animations.
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.1, duration: 0.4, ease: "easeOut" }}
    >
      <motion.button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-label={`${letter} şıkkı: ${text}${style.label ? ` (${style.label})` : ""}`}
        animate={animate}
        transition={transition}
        whileHover={status === "idle" && !disabled ? { scale: 1.015 } : undefined}
        whileTap={status === "idle" && !disabled ? { scale: 0.985 } : undefined}
        className={`relative flex w-full items-center gap-[1.2vw] rounded-2xl border-2 px-[1.2vw] py-[1.4vh] text-left transition-colors duration-300 disabled:cursor-default ${style.box}`}
      >
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `0 0 36px 9px color-mix(in srgb, var(${glowColor}) 55%, transparent)` }}
          initial={{ opacity: 0 }}
          animate={glow}
          transition={glowTransition}
        />
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl font-black transition-colors duration-300 ${style.badge}`}
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
          <motion.span
            key={status}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            className="shrink-0 rounded-lg bg-bg/60 px-3 py-1 text-[clamp(0.8rem,1.1vw,1.25rem)] font-bold"
          >
            {style.label}
          </motion.span>
        )}
      </motion.button>
    </motion.div>
  );
}
