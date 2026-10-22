import type { AppSettings, QuestionInput } from "@/types";

// Keep these limits in sync with firestore.rules.
export const POOL_NAME_MAX_LENGTH = 100;

export const QUESTION_LIMITS = {
  minOptions: 2,
  maxOptions: 6,
  defaultOptionCount: 4,
  textMaxLength: 1000,
  optionMaxLength: 300,
  explanationMaxLength: 2000,
} as const;

export const TIME_LIMIT = {
  minSec: 5,
  maxSec: 300,
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  defaultTimeLimitSec: 30,
};

/** Returns a user-facing (Turkish) error message, or null if the name is valid. */
export function validatePoolName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Havuz adı boş olamaz.";
  if (trimmed.length > POOL_NAME_MAX_LENGTH) {
    return `Havuz adı en fazla ${POOL_NAME_MAX_LENGTH} karakter olabilir.`;
  }
  return null;
}

/** Returns a list of user-facing (Turkish) error messages; empty when the question is valid. */
export function validateQuestionInput(input: QuestionInput): string[] {
  const errors: string[] = [];
  const { minOptions, maxOptions, textMaxLength, optionMaxLength, explanationMaxLength } =
    QUESTION_LIMITS;

  if (!input.poolId) errors.push("Soru bir havuza ait olmalı.");

  const text = input.text.trim();
  if (!text) errors.push("Soru metni boş olamaz.");
  else if (text.length > textMaxLength) {
    errors.push(`Soru metni en fazla ${textMaxLength} karakter olabilir.`);
  }

  if (input.options.length < minOptions || input.options.length > maxOptions) {
    errors.push(`Şık sayısı ${minOptions} ile ${maxOptions} arasında olmalı.`);
  }
  input.options.forEach((option, i) => {
    const label = String.fromCharCode(65 + i); // A, B, C...
    if (!option.trim()) errors.push(`${label} şıkkı boş olamaz.`);
    else if (option.trim().length > optionMaxLength) {
      errors.push(`${label} şıkkı en fazla ${optionMaxLength} karakter olabilir.`);
    }
  });

  if (
    !Number.isInteger(input.correctIndex) ||
    input.correctIndex < 0 ||
    input.correctIndex >= input.options.length
  ) {
    errors.push("Doğru cevap olarak bir şık seçilmeli.");
  }

  if (input.explanation && input.explanation.trim().length > explanationMaxLength) {
    errors.push(`Açıklama en fazla ${explanationMaxLength} karakter olabilir.`);
  }

  return errors;
}

/** Trims text fields and turns empty optional fields into null before saving. */
export function normalizeQuestionInput(input: QuestionInput): QuestionInput {
  const explanation = input.explanation?.trim() ?? "";
  const imageUrl = input.imageUrl?.trim() ?? "";
  return {
    poolId: input.poolId,
    text: input.text.trim(),
    options: input.options.map((o) => o.trim()),
    correctIndex: input.correctIndex,
    explanation: explanation || null,
    imageUrl: imageUrl || null,
  };
}

export function validateTimeLimit(seconds: number): string | null {
  if (!Number.isInteger(seconds) || seconds < TIME_LIMIT.minSec || seconds > TIME_LIMIT.maxSec) {
    return `Süre ${TIME_LIMIT.minSec} ile ${TIME_LIMIT.maxSec} saniye arasında bir tam sayı olmalı.`;
  }
  return null;
}
