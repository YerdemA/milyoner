// Firestore document shapes as used in the app. Timestamps are converted to Date when read.
// createdAt/updatedAt can be null briefly while a serverTimestamp() write is pending locally.

export type Pool = {
  id: string;
  name: string;
  createdAt: Date | null;
};

export type Question = {
  id: string;
  poolId: string;
  text: string;
  imageUrl: string | null; // reserved for image support; always null for now
  options: string[]; // not fixed to 4, see QUESTION_LIMITS
  correctIndex: number;
  explanation: string | null; // optional note shown after the answer is revealed
  createdAt: Date | null;
  updatedAt: Date | null;
};

/** Editable fields of a question (what the admin form produces). */
export type QuestionInput = Pick<
  Question,
  "poolId" | "text" | "imageUrl" | "options" | "correctIndex" | "explanation"
>;

export type AppSettings = {
  defaultTimeLimitSec: number;
};

// ----- Quiz (lives in the browser only, never stored in Firestore) -----

export type JokerSettings = {
  fiftyFifty: boolean;
  extraTime: boolean;
  doubleAnswer: boolean;
};

/** What the presenter chooses on the setup screen. */
export type QuizConfig = {
  poolIds: string[];
  questionCount: number;
  timeLimitSec: number | null; // null = no time limit
  totalPoints: number;
  jokers: JokerSettings;
};

/** The subset of a question the quiz screen needs. */
export type QuizQuestion = Pick<
  Question,
  "id" | "text" | "imageUrl" | "options" | "correctIndex" | "explanation"
>;

export type Quiz = {
  config: QuizConfig;
  questions: QuizQuestion[]; // already shuffled; length may be below questionCount if pools are small
  createdAt: number;
  /** A round of the questions missed in a previous quiz (same config, fewer questions). */
  isRetry?: boolean;
};
