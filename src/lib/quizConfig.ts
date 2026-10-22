// Quiz decisions (see CLAUDE.md, section 8).

export const QUESTION_COUNT = {
  min: 1,
  default: 15,
  max: 40,
} as const;

/** The total score is split evenly across the questions (e.g. 100 / 15 ≈ 6.67 per question). */
export const DEFAULT_TOTAL_POINTS = 100;

export function pointsPerQuestion(questionCount: number, totalPoints = DEFAULT_TOTAL_POINTS): number {
  return questionCount > 0 ? totalPoints / questionCount : 0;
}
