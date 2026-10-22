// Text size of the quiz screen (question, options, feedback), for small or large classrooms.
// Stored per computer, like the theme and the mute setting.

export const QUIZ_SCALES = [0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6] as const;
const DEFAULT_SCALE = 1;
const SCALE_KEY = "bilgi-yarismasi.text-scale";

const listeners = new Set<() => void>();
let current: number | null = null;

export function getQuizScale(): number {
  if (current === null) {
    try {
      const saved = Number(localStorage.getItem(SCALE_KEY));
      current = (QUIZ_SCALES as readonly number[]).includes(saved) ? saved : DEFAULT_SCALE;
    } catch {
      current = DEFAULT_SCALE;
    }
  }
  return current;
}

export function getServerQuizScale() {
  return DEFAULT_SCALE;
}

/** Moves one step up (+1) or down (-1); stays at the ends. */
export function stepQuizScale(direction: 1 | -1) {
  const i = QUIZ_SCALES.indexOf(getQuizScale() as (typeof QUIZ_SCALES)[number]);
  const next = QUIZ_SCALES[Math.min(QUIZ_SCALES.length - 1, Math.max(0, i + direction))];
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(SCALE_KEY, String(next));
  } catch {
    // Not critical.
  }
  listeners.forEach((l) => l());
}

export function subscribeQuizScale(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
