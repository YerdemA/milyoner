"use client";

import { useMemo, useSyncExternalStore } from "react";
import { loadQuiz } from "@/lib/quiz";
import type { Quiz } from "@/types";

const noopSubscribe = () => () => {};

function readRaw(): string | null {
  try {
    return JSON.stringify(loadQuiz());
  } catch {
    return null;
  }
}

/**
 * The quiz prepared on the setup screen (sessionStorage).
 * Returns undefined during server rendering, null when there is no quiz.
 */
export function useStoredQuiz(): Quiz | null | undefined {
  // A string snapshot keeps useSyncExternalStore stable between renders.
  const raw = useSyncExternalStore(noopSubscribe, readRaw, () => undefined);
  return useMemo(() => (raw === undefined ? undefined : raw ? (JSON.parse(raw) as Quiz | null) : null), [raw]);
}
