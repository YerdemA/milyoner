import { listQuestionsByPools } from "@/lib/firestore/questions";
import type { QuizState } from "@/lib/quizEngine";
import type { Quiz, QuizConfig, QuizQuestion } from "@/types";

const QUIZ_KEY = "bilgi-yarismasi.quiz";
const PROGRESS_KEY = "bilgi-yarismasi.progress";
const LAST_CONFIG_KEY = "bilgi-yarismasi.last-config";
/** Fired on window when a new quiz is saved, so the quiz screen can pick it up. */
export const QUIZ_CHANGED_EVENT = "bilgi-yarismasi:quiz-changed";

/** Fisher–Yates shuffle; returns a new array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Picks `questionCount` random questions from the selected pools, without repeats. */
export async function buildQuiz(config: QuizConfig): Promise<Quiz> {
  const all = await listQuestionsByPools(config.poolIds);
  const unique = [...new Map(all.map((q) => [q.id, q])).values()];
  const questions: QuizQuestion[] = shuffle(unique)
    .slice(0, config.questionCount)
    .map(({ id, text, imageUrl, options, correctIndex, explanation }) => ({
      id,
      text,
      imageUrl,
      options,
      correctIndex,
      explanation,
    }));
  if (questions.length === 0) throw new Error("Seçilen havuzlarda hiç soru yok.");
  return { config, questions, createdAt: Date.now() };
}

/** A new round with only the given questions of a finished quiz, in a new random order. */
export function buildRetryQuiz(quiz: Quiz, questionIds: string[]): Quiz {
  const questions = shuffle(quiz.questions.filter((q) => questionIds.includes(q.id)));
  return { config: quiz.config, questions, createdAt: Date.now(), isRetry: true };
}

// Storage access can throw (private mode, blocked storage), so every call is guarded.

/** sessionStorage: survives a page refresh on the quiz screen, cleared when the tab closes. */
export function saveQuiz(quiz: Quiz) {
  try {
    sessionStorage.setItem(QUIZ_KEY, JSON.stringify(quiz));
    sessionStorage.removeItem(PROGRESS_KEY);
  } catch {
    // The quiz still works for this page view; only refresh-recovery is lost.
  }
  window.dispatchEvent(new Event(QUIZ_CHANGED_EVENT));
}

/** Progress of the running quiz, so a page refresh continues where it was. */
export function saveProgress(quiz: Quiz, state: QuizState) {
  try {
    sessionStorage.setItem(PROGRESS_KEY, JSON.stringify({ createdAt: quiz.createdAt, state }));
  } catch {
    // Not critical.
  }
}

export function loadProgress(quiz: Quiz): QuizState | null {
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { createdAt: number; state: QuizState };
    if (saved.createdAt !== quiz.createdAt) return null;
    // A refresh during the suspense moment would leave the answer half-given; ask again instead.
    return saved.state.phase === "locked" ? { ...saved.state, phase: "asking", selected: null } : saved.state;
  } catch {
    return null;
  }
}

export function loadQuiz(): Quiz | null {
  try {
    const raw = sessionStorage.getItem(QUIZ_KEY);
    return raw ? (JSON.parse(raw) as Quiz) : null;
  } catch {
    return null;
  }
}

const TIMER_KEY = "bilgi-yarismasi.timer";

/**
 * Elapsed countdown time of the current question, so a refresh continues the countdown
 * where it stopped. (The seconds spent reloading are not counted: the class can't see the question then.)
 */
export function saveTimer(quiz: Quiz, index: number, elapsedMs: number) {
  try {
    sessionStorage.setItem(TIMER_KEY, JSON.stringify({ createdAt: quiz.createdAt, index, elapsedMs }));
  } catch {
    // Not critical.
  }
}

export function loadTimer(quiz: Quiz, index: number): number {
  try {
    const raw = sessionStorage.getItem(TIMER_KEY);
    if (!raw) return 0;
    const saved = JSON.parse(raw) as { createdAt: number; index: number; elapsedMs: number };
    return saved.createdAt === quiz.createdAt && saved.index === index ? saved.elapsedMs : 0;
  } catch {
    return 0;
  }
}

/** localStorage: the setup screen starts with the presenter's previous choices. */
export function saveLastConfig(config: QuizConfig) {
  try {
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Not important enough to report.
  }
}

export function loadLastConfig(): Partial<QuizConfig> | null {
  try {
    const raw = localStorage.getItem(LAST_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as Partial<QuizConfig>) : null;
  } catch {
    return null;
  }
}
