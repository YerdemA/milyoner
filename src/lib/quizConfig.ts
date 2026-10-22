// Quiz decisions (see CLAUDE.md, section 8).

export const QUESTION_COUNT = {
  min: 1,
  default: 15,
  max: 40,
} as const;

/** Total score is adjustable on the setup screen and split evenly across the questions. */
export const TOTAL_POINTS = {
  min: 10,
  default: 100,
  max: 1000,
  step: 10,
} as const;

/** Seconds added by the "extra time" joker. */
export const EXTRA_TIME_SEC = 30;

/** Suspense pause between locking an answer and revealing it. */
export const SUSPENSE_MS = 2500;

/** The countdown turns red (and later plays a warning sound) in the last seconds. */
export const COUNTDOWN_WARNING_SEC = 5;

export function pointsPerQuestion(questionCount: number, totalPoints: number): number {
  return questionCount > 0 ? totalPoints / questionCount : 0;
}

/**
 * Score shown on screen: rounded to a whole number so that answering everything correctly
 * gives exactly the total (15 × 6.67 would otherwise show as 100.05).
 * `earnedUnits` counts 1 per correct answer and 0.5 per second-try answer (double answer joker).
 */
export function finalScore(earnedUnits: number, questionCount: number, totalPoints: number): number {
  return Math.round(earnedUnits * pointsPerQuestion(questionCount, totalPoints));
}

/** Per-question points with Turkish decimal comma, at most 2 decimals: 6.666… -> "6,67". */
export function formatPoints(points: number): string {
  return points.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
