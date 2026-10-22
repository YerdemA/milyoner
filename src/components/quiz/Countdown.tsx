"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTDOWN_WARNING_SEC } from "@/lib/quizConfig";

type CountdownProps = {
  totalSec: number;
  /** Counts down only while running (paused during the suspense moment and after reveal). */
  running: boolean;
  onExpire: () => void;
};

const SIZE = 120;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Mount with a new `key` per question; it keeps its own elapsed time so pauses work. */
export default function Countdown({ totalSec, running, onExpire }: CountdownProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedRef = useRef(0);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      elapsedRef.current += now - last;
      last = now;
      setElapsedMs(elapsedRef.current);
      if (elapsedRef.current >= totalSec * 1000 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [running, totalSec]);

  const remainingMs = Math.max(0, totalSec * 1000 - elapsedMs);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const fraction = totalSec > 0 ? remainingMs / (totalSec * 1000) : 0;
  const warning = remainingSec <= COUNTDOWN_WARNING_SEC;

  return (
    <div
      role="timer"
      aria-label={`Kalan süre ${remainingSec} saniye`}
      className={`relative shrink-0 ${warning && running ? "animate-pulse" : ""}`}
      style={{ width: "clamp(5rem, 8vw, 8rem)", height: "clamp(5rem, 8vw, 8rem)" }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-raised" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className={`transition-[stroke-dashoffset] duration-100 ease-linear ${warning ? "stroke-danger" : "stroke-accent"}`}
        />
      </svg>
      <span
        className={`absolute inset-0 flex flex-col items-center justify-center font-black tabular-nums leading-none ${warning ? "text-danger" : "text-fg"}`}
        style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)" }}
      >
        {remainingSec}
        <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted">sn</span>
      </span>
    </div>
  );
}
