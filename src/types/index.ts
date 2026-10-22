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
