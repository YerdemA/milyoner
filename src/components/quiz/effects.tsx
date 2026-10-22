"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo } from "react";

/** Small seeded PRNG so particle layouts are deterministic per burst (keeps render pure). */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONFETTI_COLORS = ["var(--color-accent)", "var(--color-accent-strong)", "var(--color-success)", "var(--color-fg)"];

/** Confetti burst from the bottom center. Change `seed` to fire a new burst. */
export function Confetti({ seed, count = 70 }: { seed: number; count?: number }) {
  const pieces = useMemo(() => {
    const rand = mulberry32(seed + 1);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (rand() - 0.5) * 110, // vw
      peak: 35 + rand() * 55, // vh above the bottom
      rotate: (rand() - 0.5) * 900,
      size: 8 + rand() * 10,
      delay: rand() * 0.15,
      duration: 1.6 + rand() * 0.9,
      color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
      round: rand() > 0.6,
    }));
  }, [seed, count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={`${seed}-${p.id}`}
          className="absolute bottom-0 left-1/2 block"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [`0vw`, `${p.x * 0.7}vw`, `${p.x}vw`],
            y: [`0vh`, `-${p.peak}vh`, `${10 - p.peak * 0.2}vh`],
            rotate: p.rotate,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: ["easeOut", "easeIn"], times: [0, 0.45, 1] }}
        />
      ))}
    </div>
  );
}

/** Full-screen color flash (green for correct, red for wrong). Change `seed` to replay. */
export function ScreenFlash({ seed, tone }: { seed: number; tone: "success" | "danger" }) {
  return (
    <motion.div
      key={seed}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
      style={{
        background:
          tone === "success"
            ? "radial-gradient(ellipse at center, transparent 30%, color-mix(in srgb, var(--color-success) 45%, transparent) 100%)"
            : "radial-gradient(ellipse at center, transparent 30%, color-mix(in srgb, var(--color-danger) 55%, transparent) 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 1.1, times: [0, 0.15, 1] }}
    />
  );
}

/** A number that counts up/down smoothly to `value`. */
export function AnimatedNumber({ value, duration = 0.8 }: { value: number; duration?: number }) {
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

/** Score counting up from 0 on mount (summary screen). */
export function CountUp({ to, duration = 1.6 }: { to: number; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    const controls = animate(mv, to, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [mv, to, duration]);
  return <motion.span>{rounded}</motion.span>;
}
