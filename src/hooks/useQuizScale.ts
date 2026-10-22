"use client";

import { useSyncExternalStore } from "react";
import { getQuizScale, getServerQuizScale, QUIZ_SCALES, stepQuizScale, subscribeQuizScale } from "@/lib/quizScale";

/** Quiz screen text size (CSS zoom factor), persisted in localStorage. */
export function useQuizScale() {
  const scale = useSyncExternalStore(subscribeQuizScale, getQuizScale, getServerQuizScale);
  return {
    scale,
    canGrow: scale < QUIZ_SCALES[QUIZ_SCALES.length - 1],
    canShrink: scale > QUIZ_SCALES[0],
    grow: () => stepQuizScale(1),
    shrink: () => stepQuizScale(-1),
  };
}
